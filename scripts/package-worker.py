#!/usr/bin/env python3
"""Build or check the portable worker download using only committed sources.

Run ``python scripts/package-worker.py`` after changing worker sources, then
``python scripts/package-worker.py --check`` before publishing the download.
The explicit allowlist never discovers environment files or local credentials.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import posixpath
import re
import subprocess
from pathlib import Path
from zipfile import BadZipFile, ZIP_STORED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parent.parent
SOURCES = tuple(sorted((
    "worker/CHECK-WORKER.cmd",
    "worker/Dockerfile.application",
    "worker/README.md",
    "worker/START-WORKER.cmd",
    "worker/application-profile.mjs",
    "worker/doctor.mjs",
    "worker/fleet.mjs",
    "worker/runner.mjs",
    "worker/trilogy-proof.mjs",
)))
MANIFEST_PATH = "worker/PACKAGE-MANIFEST.json"
STAMP = (1980, 1, 1, 0, 0, 0)
MODE = 0o100644
STATIC_IMPORT = re.compile(
    r'''(?:^|[;\n])\s*(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]''',
    re.MULTILINE,
)
DYNAMIC_IMPORT = re.compile(r'''\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)''')


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def git(*args: str) -> bytes:
    result = subprocess.run(
        ["git", "-C", str(ROOT), *args], capture_output=True, check=False,
    )
    if result.returncode:
        raise ValueError("Unable to read the committed worker source")
    return result.stdout


def source_snapshot() -> tuple[dict[str, bytes], dict]:
    head = git("rev-parse", "--verify", "HEAD^{commit}").decode().strip()
    tracked = {}
    for row in git("ls-tree", "-r", "-z", head, "--", *SOURCES).split(b"\0"):
        if not row:
            continue
        metadata, name = row.split(b"\t", 1)
        mode, kind, _oid = metadata.decode().split()
        tracked[name.decode()] = (mode, kind)
    files = {}
    for name in SOURCES:
        if tracked.get(name) not in (("100644", "blob"), ("100755", "blob")):
            raise ValueError("Required committed regular file is missing: " + name)
        value = git("show", head + ":" + name)
        path = ROOT / name
        if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(ROOT):
            raise ValueError("Worker source must be a regular local file: " + name)
        if path.read_bytes() != value:
            raise ValueError("Commit worker source changes before packaging: " + name)
        files[name] = value

    # Use the last commit that changed the allowlisted sources. A later commit
    # saving this archive or unrelated documentation must not invalidate it.
    source_commit = git("log", "-1", "--format=%H", head, "--", *SOURCES).decode().strip()
    imports = []
    for name, value in files.items():
        if not name.endswith(".mjs"):
            continue
        source = value.decode("utf-8", errors="strict")
        dependencies = STATIC_IMPORT.findall(source)
        dynamic_dependencies = DYNAMIC_IMPORT.findall(source)
        if len(re.findall(r"\bimport\s*\(", source)) != len(dynamic_dependencies):
            raise ValueError("Worker dynamic dependencies must use literal module paths: " + name)
        dependencies += [match[1] for match in dynamic_dependencies]
        for specifier in sorted(set(dependencies)):
            if specifier.startswith("node:"):
                continue
            if not specifier.startswith(("./", "../")) or "?" in specifier or "#" in specifier:
                raise ValueError("Unpackaged worker dependency: " + name + " -> " + specifier)
            target = posixpath.normpath(posixpath.join(posixpath.dirname(name), specifier))
            if target not in files:
                raise ValueError("Missing allowlisted worker dependency: " + name + " -> " + target)
            imports.append({"source": name, "specifier": specifier, "target": target})

    manifest = {
        "schema": "mgr.worker-package.v1",
        "sourceCommit": source_commit,
        "scope": "Portable worker source package; no credentials or Docker-host qualification",
        "files": [{"path": name, "bytes": len(value), "sha256": sha256(value)} for name, value in files.items()],
        "relativeImports": imports,
    }
    return files, manifest


def archive_bytes(files: dict[str, bytes], manifest: dict) -> bytes:
    entries = {**files, MANIFEST_PATH: (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()}
    output = io.BytesIO()
    # Stored entries avoid zlib-version differences. This small source package
    # has stable ordering, timestamps, modes and bytes across repeated builds.
    with ZipFile(output, "w", compression=ZIP_STORED) as archive:
        for name, value in sorted(entries.items()):
            entry = ZipInfo(name, date_time=STAMP)
            entry.create_system = 3
            entry.external_attr = MODE << 16
            entry.compress_type = ZIP_STORED
            archive.writestr(entry, value)
    return output.getvalue()


def check_archive(path: Path, files: dict[str, bytes], manifest: dict, expected: bytes) -> None:
    entries = {**files, MANIFEST_PATH: (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()}
    if not path.is_file() or path.is_symlink():
        raise ValueError("Worker archive is missing or not a regular file")
    if path.stat().st_size > len(expected) * 2:
        raise ValueError("Worker archive exceeds its bounded source-package size")
    with ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)) or set(names) != set(entries):
            missing = sorted(set(entries) - set(names))
            unexpected = sorted(set(names) - set(entries))
            raise ValueError("Worker archive paths differ: " + json.dumps({"missing": missing, "unexpected": unexpected, "duplicates": len(names) != len(set(names))}))
        for entry in archive.infolist():
            value = entries[entry.filename]
            if entry.file_size != len(value) or archive.read(entry) != value:
                raise ValueError("Worker archive bytes differ from source: " + entry.filename)
            if entry.date_time != STAMP or entry.create_system != 3 or entry.external_attr != MODE << 16 or entry.compress_type != ZIP_STORED:
                raise ValueError("Worker archive metadata is not deterministic: " + entry.filename)
    if path.read_bytes() != expected:
        raise ValueError("Worker archive does not match the deterministic package bytes")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the existing archive without writing it")
    parser.add_argument("--output", type=Path, default=ROOT / "public/omnidev-worker.zip", help="archive destination, also used by --check")
    args = parser.parse_args()
    try:
        files, manifest = source_snapshot()
        expected = archive_bytes(files, manifest)
        if not args.check:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_bytes(expected)
        check_archive(args.output, files, manifest, expected)
        print(json.dumps({"status": "verified", "operation": "check" if args.check else "build", "sourceCommit": manifest["sourceCommit"], "sourceFiles": len(files), "archiveEntries": len(files) + 1, "relativeImports": len(manifest["relativeImports"]), "zipBytes": len(expected), "zipSha256": sha256(expected)}, sort_keys=True))
        return 0
    except (ValueError, OSError, BadZipFile, UnicodeError) as error:
        print(json.dumps({"status": "failed", "reason": str(error)}, sort_keys=True))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
