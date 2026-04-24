'use client';

export function BackerEducationSection() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800 mb-6">
      <h3 className="font-bold text-lg mb-4">🛡️ Your Money is Safe</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step 1: Factory Verified</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">We confirm the factory has your order</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step 2: Production Proof</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Creator shows your product is being made</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step 3: Shipped & Delivered</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Tracking shows your package is on the way</p>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-amber-900 dark:text-amber-100">What if something goes wrong?</summary>
        <div className="mt-3 space-y-2 text-amber-800 dark:text-amber-200">
          <p>• <strong>Creator delays?</strong> We'll notify you and hold funds until they deliver.</p>
          <p>• <strong>Creator disappears?</strong> File a dispute. We help you pursue recovery.</p>
        </div>
      </details>
    </div>
  );
}
