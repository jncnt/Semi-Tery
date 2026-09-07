export const getDisplayName = (record: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
}) => {
  const lastName = record.last_name ? `${record.last_name},` : '';
  return [lastName, record.first_name, record.middle_name].filter(Boolean).join(' ');
};
