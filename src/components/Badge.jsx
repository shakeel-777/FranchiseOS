import { badgeClass } from '../utils/format';

export default function Badge({ status, label }) {
  return <span className={badgeClass(status)}>{label ?? status}</span>;
}
