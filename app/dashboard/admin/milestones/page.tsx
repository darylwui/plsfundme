import { MilestoneReviewQueue } from '@/components/admin/MilestoneReviewQueue';

export default function AdminMilestonesPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Milestone submissions</h1>
      <MilestoneReviewQueue />
    </div>
  );
}
