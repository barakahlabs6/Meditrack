const roleStyles: Record<string, string> = {
  admin: 'bg-role-admin/10 text-role-admin',
  doctor: 'bg-role-doctor/10 text-role-doctor',
  receptionist: 'bg-role-receptionist/10 text-role-receptionist',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        roleStyles[role] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {role}
    </span>
  );
}
