import {BuildProgressView} from '@/components/build-progress';

export default function ProgressPage() {
  return <main className="progress-page">
    <a className="secondary-btn" href="/#runtime">Back to OmniDev</a>
    <BuildProgressView/>
  </main>;
}
