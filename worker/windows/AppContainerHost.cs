// Native Windows security boundary. No candidate code executes in this host process.
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32.SafeHandles;

public static class OmniAppContainerHost {
 [StructLayout(LayoutKind.Sequential)] struct SECURITY_ATTRIBUTES { public int length; public IntPtr descriptor; public int inherit; }
 [StructLayout(LayoutKind.Sequential)] struct SECURITY_CAPABILITIES { public IntPtr sid,capabilities; public uint count,reserved; }
 [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] struct STARTUPINFO { public int cb; public string reserved,desktop,title; public uint x,y,xSize,ySize,xChars,yChars,fill,flags; public short show,reservedSize; public IntPtr reserved2,input,output,error; }
 [StructLayout(LayoutKind.Sequential)] struct STARTUPINFOEX { public STARTUPINFO startup; public IntPtr attributes; }
 [StructLayout(LayoutKind.Sequential)] struct PROCESS_INFORMATION { public IntPtr process,thread; public uint pid,tid; }
 [StructLayout(LayoutKind.Sequential)] struct BASIC_LIMIT { public long processTime,jobTime;public uint flags;public UIntPtr minWorking,maxWorking;public uint activeLimit;public UIntPtr affinity;public uint priority,scheduling; }
 [StructLayout(LayoutKind.Sequential)] struct IO_COUNTERS { public ulong a,b,c,d,e,f; }
 [StructLayout(LayoutKind.Sequential)] struct EXTENDED_LIMIT { public BASIC_LIMIT basic;public IO_COUNTERS io;public UIntPtr processMemory,jobMemory,peakProcess,peakJob; }
 [StructLayout(LayoutKind.Sequential)] struct ACCOUNTING { public long a,b,c,d;public uint faults,total,active,terminated; }
 [StructLayout(LayoutKind.Sequential)] struct ACCOUNTING_IO { public ACCOUNTING basic;public IO_COUNTERS io; }
 [StructLayout(LayoutKind.Sequential)] struct CPU_LIMIT { public uint flags,rate; }
 [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int CreateAppContainerProfile(string name,string display,string description,IntPtr capabilities,uint count,out IntPtr sid);
 [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int DeleteAppContainerProfile(string name);
 [DllImport("userenv.dll",CharSet=CharSet.Unicode)] static extern int GetAppContainerFolderPath(string sid,out IntPtr path);
 [DllImport("advapi32.dll")] static extern IntPtr FreeSid(IntPtr sid);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool InitializeProcThreadAttributeList(IntPtr list,int count,int flags,ref IntPtr size);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool UpdateProcThreadAttribute(IntPtr list,uint flags,IntPtr attribute,IntPtr value,IntPtr size,IntPtr previous,IntPtr returned);
 [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr list);
 [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool CreateProcessW(string application,StringBuilder command,IntPtr processSecurity,IntPtr threadSecurity,bool inherit,uint flags,IntPtr environment,string cwd,ref STARTUPINFOEX startup,out PROCESS_INFORMATION process);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool CreatePipe(out IntPtr read,out IntPtr write,ref SECURITY_ATTRIBUTES security,uint size);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetHandleInformation(IntPtr handle,uint mask,uint flags);
 [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern IntPtr CreateFileW(string name,uint access,uint share,ref SECURITY_ATTRIBUTES security,uint creation,uint flags,IntPtr template);
 [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr CreateJobObjectW(IntPtr security,IntPtr name);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int info,IntPtr value,uint length);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool QueryInformationJobObject(IntPtr job,int info,out ACCOUNTING value,uint size,IntPtr returned);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool IsProcessInJob(IntPtr process,IntPtr job,out bool inJob);
 [DllImport("kernel32.dll",SetLastError=true,EntryPoint="QueryInformationJobObject")] static extern bool QueryLimits(IntPtr job,int info,out EXTENDED_LIMIT value,uint size,IntPtr returned);
 [DllImport("kernel32.dll",SetLastError=true,EntryPoint="QueryInformationJobObject")] static extern bool QueryIo(IntPtr job,int info,out ACCOUNTING_IO value,uint size,IntPtr returned);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateJobObject(IntPtr job,uint code);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool TerminateProcess(IntPtr process,uint code);
 [DllImport("kernel32.dll",SetLastError=true)] static extern uint ResumeThread(IntPtr thread);
 [DllImport("kernel32.dll",SetLastError=true)] static extern uint WaitForSingleObject(IntPtr handle,uint milliseconds);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetExitCodeProcess(IntPtr process,out uint code);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 [DllImport("advapi32.dll",SetLastError=true)] static extern bool OpenProcessToken(IntPtr process,uint desired,out IntPtr token);
 [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetTokenInformation(IntPtr token,int info,IntPtr value,int length,out int needed);

 public sealed class Outcome {
  public string Profile,PackageSid,ProfileStorage,Output,StopReason; public uint ProcessId,ExitCode,ActiveProcessesAfter,TotalProcesses;
  public ulong WriteBytesObserved,ScratchBytesObserved,PeakJobMemoryBytes,ConfiguredJobMemoryBytes;public int WritableEntriesObserved;
  public int TokenIsAppContainer,CapabilityCount,ProfileDeletionHResult;
  public bool JobAssignedBeforeResume,JobAssignedAtCreation,CleanupVerified;
 }
 static void Check(bool success,string operation){if(!success)throw new Win32Exception(Marshal.GetLastWin32Error(),operation);}
 static IntPtr Alloc<T>(T value){IntPtr ptr=Marshal.AllocHGlobal(Marshal.SizeOf<T>());Marshal.StructureToPtr(value,ptr,false);return ptr;}
 static void SetJob<T>(IntPtr job,int type,T value){IntPtr ptr=Alloc(value);try{Check(SetInformationJobObject(job,type,ptr,(uint)Marshal.SizeOf<T>()),"SetJobPolicy "+type);}finally{Marshal.FreeHGlobal(ptr);}}
 static IntPtr TokenValue(IntPtr token,int type){int length;GetTokenInformation(token,type,IntPtr.Zero,0,out length);if(length<=0)throw new Win32Exception(Marshal.GetLastWin32Error(),"TokenSize");IntPtr ptr=Marshal.AllocHGlobal(length);if(!GetTokenInformation(token,type,ptr,length,out length)){Marshal.FreeHGlobal(ptr);Check(false,"TokenValue");}return ptr;}
 public static int DeleteOwnedProfile(string profile){if(!System.Text.RegularExpressions.Regex.IsMatch(profile,"^omni-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"))throw new ArgumentException("Invalid isolated profile name");return DeleteAppContainerProfile(profile);}
 static string Quote(string value){if(value.IndexOf('"')>=0||value.EndsWith("\\"))throw new ArgumentException("Unsupported command argument");return "\""+value+"\"";}
 static void ValidateOwnedTree(string root){
  if(!Path.IsPathFullyQualified(root)||!Directory.Exists(root))throw new ArgumentException("Owned root must exist");
  for(DirectoryInfo parent=new DirectoryInfo(root);parent!=null;parent=parent.Parent)if((parent.Attributes&FileAttributes.ReparsePoint)!=0)throw new InvalidOperationException("Reparse ancestor denied");
  foreach(string path in Directory.EnumerateFileSystemEntries(root,"*",SearchOption.AllDirectories))if((File.GetAttributes(path)&FileAttributes.ReparsePoint)!=0)throw new InvalidOperationException("Reparse entry denied");
 }
 static long MeasureWritable(string directory,ref int count){long total=0;if(!Directory.Exists(directory))return 0;foreach(string path in Directory.EnumerateFileSystemEntries(directory)){if(++count>4096)throw new InvalidOperationException("Writable entry budget exceeded");var attributes=File.GetAttributes(path);if((attributes&FileAttributes.ReparsePoint)!=0)throw new InvalidOperationException("Writable reparse entry denied");if((attributes&FileAttributes.Directory)!=0)total+=MeasureWritable(path,ref count);else total+=new FileInfo(path).Length;}return total;}
 static void Grant(string path,string owner,string sid,bool writable){
  // Replace ACLs only on this newly-created attempt tree. No broad package groups.
  string rights=writable?"FA":"GRGX";
  string sddl="D:P(A;OICI;FA;;;"+owner+")(A;OICI;FA;;;SY)(A;OICI;"+rights+";;;"+sid+")";
  if(Directory.Exists(path)){var acl=new DirectorySecurity();acl.SetSecurityDescriptorSddlForm(sddl,AccessControlSections.Access);FileSystemAclExtensions.SetAccessControl(new DirectoryInfo(path),acl);}
  else{var acl=new FileSecurity();acl.SetSecurityDescriptorSddlForm(sddl.Replace("OICI;",";"),AccessControlSections.Access);FileSystemAclExtensions.SetAccessControl(new FileInfo(path),acl);}
 }
 static void LabelLow(string path){
  // The owner may lower integrity on its own scratch folder; failure is fatal.
  var info=new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"icacls.exe")){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true};
  info.ArgumentList.Add(path);info.ArgumentList.Add("/setintegritylevel");info.ArgumentList.Add("(OI)(CI)L");
  using(var process=Process.Start(info)){var a=process.StandardOutput.ReadToEndAsync();var b=process.StandardError.ReadToEndAsync();if(!process.WaitForExit(10000)){process.Kill();throw new InvalidOperationException("Scratch integrity setup timed out");}a.GetAwaiter().GetResult();b.GetAwaiter().GetResult();if(process.ExitCode!=0)throw new InvalidOperationException("Scratch integrity setup denied");}
 }
 public static Outcome Run(string ownedRoot,string nodePath,string workingDirectory,string[] arguments,int timeoutMs,int outputLimit,string expectedProfile=null,int probeBeforeResumeMs=0){
  ownedRoot=Path.GetFullPath(ownedRoot);nodePath=Path.GetFullPath(nodePath);workingDirectory=Path.GetFullPath(workingDirectory);
  string prefix=ownedRoot+Path.DirectorySeparatorChar;
  if(!nodePath.StartsWith(prefix,StringComparison.OrdinalIgnoreCase)||!workingDirectory.StartsWith(prefix,StringComparison.OrdinalIgnoreCase)||timeoutMs<100||timeoutMs>180000||outputLimit<100||outputLimit>20000)throw new ArgumentException("Attempt bounds denied");
  if(probeBeforeResumeMs<0||probeBeforeResumeMs>10000)throw new ArgumentException("Invalid probe delay");
  ValidateOwnedTree(ownedRoot);string scratch=Path.Combine(ownedRoot,"scratch");Directory.CreateDirectory(scratch);
  string profile=expectedProfile??("omni-"+Guid.NewGuid().ToString());if(!System.Text.RegularExpressions.Regex.IsMatch(profile,"^omni-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"))throw new ArgumentException("Invalid isolated profile name");string owner=WindowsIdentity.GetCurrent().User.Value;
  var result=new Outcome{Profile=profile,Output="",ExitCode=uint.MaxValue,ActiveProcessesAfter=uint.MaxValue,ProfileDeletionHResult=-1};
  IntPtr sid=IntPtr.Zero,job=IntPtr.Zero,attributes=IntPtr.Zero,capPtr=IntPtr.Zero,handlesPtr=IntPtr.Zero,jobListPtr=IntPtr.Zero,environment=IntPtr.Zero,read=IntPtr.Zero,write=IntPtr.Zero,input=IntPtr.Zero;
  PROCESS_INFORMATION pi=new PROCESS_INFORMATION();bool created=false,profileCreated=false;Task reading=null;FileStream outputStream=null;var output=new MemoryStream();int exceeded=0;
  try{
   int hr=CreateAppContainerProfile(profile,"OmniDev owned attempt","No-capability isolated Node verification attempt",IntPtr.Zero,0,out sid);if(hr!=0)Marshal.ThrowExceptionForHR(hr);profileCreated=true;File.WriteAllText(ownedRoot+".host-state.json",System.Text.Json.JsonSerializer.Serialize(new{profileName=profile,processId=0,profileCreated=true}));
   result.PackageSid=new SecurityIdentifier(sid).Value;
   IntPtr folder;int folderHr=GetAppContainerFolderPath(result.PackageSid,out folder);if(folderHr!=0)Marshal.ThrowExceptionForHR(folderHr);try{string location=Marshal.PtrToStringUni(folder);var directory=new DirectoryInfo(location);if(directory.Name.Equals(profile,StringComparison.OrdinalIgnoreCase))result.ProfileStorage=directory.FullName;else if(directory.Parent!=null&&directory.Parent.Name.Equals(profile,StringComparison.OrdinalIgnoreCase))result.ProfileStorage=directory.Parent.FullName;else throw new InvalidOperationException("Unexpected owned profile storage layout");}finally{Marshal.FreeCoTaskMem(folder);}
   Grant(ownedRoot,owner,result.PackageSid,false);
   foreach(string path in Directory.EnumerateFileSystemEntries(ownedRoot,"*",SearchOption.AllDirectories))Grant(path,owner,result.PackageSid,(path.Equals(scratch,StringComparison.OrdinalIgnoreCase)||path.StartsWith(scratch+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)));
   LabelLow(scratch);
   job=CreateJobObjectW(IntPtr.Zero,IntPtr.Zero);Check(job!=IntPtr.Zero,"CreateJob");
   var limits=new EXTENDED_LIMIT();limits.basic.flags=0x2000|0x200|0x8;limits.basic.activeLimit=16;limits.jobMemory=(UIntPtr)(384UL*1024*1024);SetJob(job,9,limits);SetJob(job,15,new CPU_LIMIT{flags=1|4,rate=2000});SetJob(job,4,(uint)0xff);
   var sa=new SECURITY_ATTRIBUTES{length=Marshal.SizeOf<SECURITY_ATTRIBUTES>(),inherit=1};
   Check(CreatePipe(out read,out write,ref sa,0),"CreateOutputPipe");Check(SetHandleInformation(read,1,0),"ProtectOutputReadHandle");
   input=CreateFileW("NUL",0x80000000,3,ref sa,3,0,IntPtr.Zero);Check(input!=new IntPtr(-1),"OpenNullInput");
   IntPtr size=IntPtr.Zero;InitializeProcThreadAttributeList(IntPtr.Zero,3,0,ref size);attributes=Marshal.AllocHGlobal(size);Check(InitializeProcThreadAttributeList(attributes,3,0,ref size),"InitializeAttributes");
   capPtr=Alloc(new SECURITY_CAPABILITIES{sid=sid,count=0});Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x20009),capPtr,(IntPtr)Marshal.SizeOf<SECURITY_CAPABILITIES>(),IntPtr.Zero,IntPtr.Zero),"SetAppContainerCapabilities");
   handlesPtr=Marshal.AllocHGlobal(IntPtr.Size*2);Marshal.WriteIntPtr(handlesPtr,0,write);Marshal.WriteIntPtr(handlesPtr,IntPtr.Size,input);Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x20002),handlesPtr,(IntPtr)(IntPtr.Size*2),IntPtr.Zero,IntPtr.Zero),"SetInheritedHandleAllowlist");
   jobListPtr=Marshal.AllocHGlobal(IntPtr.Size);Marshal.WriteIntPtr(jobListPtr,job);Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x2000d),jobListPtr,(IntPtr)IntPtr.Size,IntPtr.Zero,IntPtr.Zero),"AssignJobAtProcessCreation");
   var startup=new STARTUPINFOEX();startup.startup.cb=Marshal.SizeOf<STARTUPINFOEX>();startup.startup.flags=0x100;startup.startup.input=input;startup.startup.output=write;startup.startup.error=write;startup.attributes=attributes;
   var vars=new SortedDictionary<string,string>(StringComparer.OrdinalIgnoreCase){{"SystemRoot",Environment.GetEnvironmentVariable("SystemRoot")},{"WINDIR",Environment.GetEnvironmentVariable("SystemRoot")},{"PATH",Path.GetDirectoryName(nodePath)},{"TEMP",scratch},{"TMP",scratch},{"HOME",scratch},{"USERPROFILE",Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)},{"LOCALAPPDATA",Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)},{"APPDATA",Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)},{"CI","true"}};
   var envText=new StringBuilder();foreach(var pair in vars)envText.Append(pair.Key+"="+pair.Value+'\0');envText.Append('\0');environment=Marshal.StringToHGlobalUni(envText.ToString());
   var command=new StringBuilder(Quote(nodePath));foreach(string arg in arguments)command.Append(" "+Quote(arg));
   Check(CreateProcessW(nodePath,command,IntPtr.Zero,IntPtr.Zero,true,0x80000|0x400|0x4|0x08000000,environment,workingDirectory,ref startup,out pi),"CreateContainedProcess");created=true;result.ProcessId=pi.pid;
   bool inOwnedJob;Check(IsProcessInJob(pi.process,job,out inOwnedJob)&&inOwnedJob,"VerifyAtomicJobMembership");result.JobAssignedAtCreation=true;result.JobAssignedBeforeResume=true;
   IntPtr token;Check(OpenProcessToken(pi.process,8,out token),"OpenChildToken");try{IntPtr value=TokenValue(token,29);try{result.TokenIsAppContainer=Marshal.ReadInt32(value);}finally{Marshal.FreeHGlobal(value);}value=TokenValue(token,30);try{result.CapabilityCount=Marshal.ReadInt32(value);}finally{Marshal.FreeHGlobal(value);}value=TokenValue(token,31);try{if(new SecurityIdentifier(Marshal.ReadIntPtr(value)).Value!=result.PackageSid)throw new InvalidOperationException("Package token SID mismatch");}finally{Marshal.FreeHGlobal(value);}}finally{CloseHandle(token);}
   if(result.TokenIsAppContainer!=1||result.CapabilityCount!=0)throw new InvalidOperationException("Child token boundary mismatch");
   CloseHandle(write);write=IntPtr.Zero;CloseHandle(input);input=IntPtr.Zero;
   outputStream=new FileStream(new SafeFileHandle(read,true),FileAccess.Read,4096,false);read=IntPtr.Zero;
   reading=Task.Run(()=>{byte[] buffer=new byte[1024];for(;;){int count=outputStream.Read(buffer,0,buffer.Length);if(count==0)break;lock(output){int take=Math.Min(count,Math.Max(0,outputLimit-(int)output.Length));if(take>0)output.Write(buffer,0,take);if(take<count)Interlocked.Exchange(ref exceeded,1);}}});
   File.WriteAllText(ownedRoot+".host-state.json",System.Text.Json.JsonSerializer.Serialize(new{profileName=profile,processId=pi.pid,profileCreated=true,profileStorage=result.ProfileStorage,jobAssignedAtCreation=result.JobAssignedAtCreation,packageSid=result.PackageSid,tokenIsAppContainer=result.TokenIsAppContainer,capabilityCount=result.CapabilityCount}));
   if(probeBeforeResumeMs>0)Thread.Sleep(probeBeforeResumeMs);
   Check(ResumeThread(pi.thread)!=uint.MaxValue,"ResumeContainedThread");var clock=Stopwatch.StartNew();
   while(WaitForSingleObject(pi.process,25)==0x102){try{int entries=0;long bytes=MeasureWritable(scratch,ref entries)+MeasureWritable(result.ProfileStorage,ref entries);result.ScratchBytesObserved=Math.Max(result.ScratchBytesObserved,(ulong)bytes);result.WritableEntriesObserved=Math.Max(result.WritableEntriesObserved,entries);if(bytes>8L*1024*1024){result.StopReason="write-budget";break;}}catch{result.StopReason="writable-tree-policy";break;}ACCOUNTING_IO io;Check(QueryIo(job,8,out io,(uint)Marshal.SizeOf<ACCOUNTING_IO>(),IntPtr.Zero),"ReadJobIoBudget");result.WriteBytesObserved=io.io.e;if(io.io.e>8UL*1024*1024){result.StopReason="write-budget";break;}if(Volatile.Read(ref exceeded)!=0){result.StopReason="output-limit";break;}if(clock.ElapsedMilliseconds>=timeoutMs){result.StopReason="timeout";break;}}
   if(Volatile.Read(ref exceeded)!=0)result.StopReason="output-limit";
   Check(TerminateJobObject(job,1),"TerminateOwnedJobTree");WaitForSingleObject(pi.process,5000);Check(GetExitCodeProcess(pi.process,out result.ExitCode),"ReadExitStatus");
   ACCOUNTING state=new ACCOUNTING();for(int retry=0;retry<200;retry++){Check(QueryInformationJobObject(job,1,out state,(uint)Marshal.SizeOf<ACCOUNTING>(),IntPtr.Zero),"ReadJobAccounting");if(state.active==0)break;Thread.Sleep(25);}result.ActiveProcessesAfter=state.active;result.TotalProcesses=state.total;
   ACCOUNTING_IO finalIo;Check(QueryIo(job,8,out finalIo,(uint)Marshal.SizeOf<ACCOUNTING_IO>(),IntPtr.Zero),"ReadFinalIoBudget");result.WriteBytesObserved=finalIo.io.e;if(finalIo.io.e>8UL*1024*1024)result.StopReason="write-budget";
   EXTENDED_LIMIT finalLimits;Check(QueryLimits(job,9,out finalLimits,(uint)Marshal.SizeOf<EXTENDED_LIMIT>(),IntPtr.Zero),"ReadPeakJobMemory");result.PeakJobMemoryBytes=finalLimits.peakJob.ToUInt64();result.ConfiguredJobMemoryBytes=finalLimits.jobMemory.ToUInt64();if((finalLimits.basic.flags&0x200)==0||result.ConfiguredJobMemoryBytes!=384UL*1024*1024)throw new InvalidOperationException("Job memory policy readback mismatch");
   if(reading!=null&&!reading.Wait(5000))throw new InvalidOperationException("Output pipe cleanup unverified");
   if(Volatile.Read(ref exceeded)!=0)result.StopReason="output-limit";
   lock(output)result.Output=Encoding.UTF8.GetString(output.ToArray());
   result.CleanupVerified=result.ActiveProcessesAfter==0;
  }finally{
   if(created&&pi.process!=IntPtr.Zero){if(job!=IntPtr.Zero)TerminateJobObject(job,1);TerminateProcess(pi.process,1);WaitForSingleObject(pi.process,5000);}
   if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(pi.process!=IntPtr.Zero)CloseHandle(pi.process);if(job!=IntPtr.Zero)CloseHandle(job);
   if(write!=IntPtr.Zero)CloseHandle(write);if(input!=IntPtr.Zero&&input!=new IntPtr(-1))CloseHandle(input);if(read!=IntPtr.Zero)CloseHandle(read);if(outputStream!=null)outputStream.Dispose();output.Dispose();
   if(attributes!=IntPtr.Zero){DeleteProcThreadAttributeList(attributes);Marshal.FreeHGlobal(attributes);}if(capPtr!=IntPtr.Zero)Marshal.FreeHGlobal(capPtr);if(handlesPtr!=IntPtr.Zero)Marshal.FreeHGlobal(handlesPtr);if(environment!=IntPtr.Zero)Marshal.FreeHGlobal(environment);if(jobListPtr!=IntPtr.Zero)Marshal.FreeHGlobal(jobListPtr);
   if(sid!=IntPtr.Zero)FreeSid(sid);if(profileCreated){result.ProfileDeletionHResult=DeleteAppContainerProfile(profile);if(result.ProfileDeletionHResult!=0||result.ProfileStorage!=null&&Directory.Exists(result.ProfileStorage))result.CleanupVerified=false;}
  }
  return result;
 }
}
