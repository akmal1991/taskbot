// Parameters shared by ticket queries: $1 = global ticket permission, $2 = authenticated actor.
export const ticketRecipientSQL = `(t.recipient_user_id=$2 OR (t.recipient_user_id IS NULL AND EXISTS (
  SELECT 1 FROM ut_users me WHERE me.id=$2 AND (me.department_id=t.department_id OR EXISTS (
    SELECT 1 FROM ut_memberships m WHERE m.user_id=me.id AND m.department_id=t.department_id)))))`;
export const ticketVisibleSQL = `($1::boolean OR t.user_id=$2 OR ${ticketRecipientSQL})`;
export const ticketRespondSQL = `($1::boolean OR (t.user_id<>$2 AND ${ticketRecipientSQL}))`;
