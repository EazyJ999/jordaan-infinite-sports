export function NoReturnNotice() {
  return (
    <aside className="border border-danger bg-paper px-4 py-4">
      <p className="text-xs uppercase tracking-widest text-danger">No refunds or returns on custom items</p>
      <p className="mt-2 text-sm">
        A name, number or badge is made for that order. Once it is printed, it cannot be refunded or returned. This is final.
        A fit difference of 2–4 cm is normal and is not a reason for a return.
      </p>
    </aside>
  );
}
