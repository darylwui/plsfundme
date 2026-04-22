import { MilestoneReviewQueue } from '@/components/admin/MilestoneReviewQueue';

export default function AdminMilestonesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Milestone Review Queue</h1>
      <MilestoneReviewQueue />
    </div>
  );
}
