export const EMPLOYEE_ACTIVE_DURATION_SQL = `GREATEST(
  0,
  EXTRACT(EPOCH FROM (COALESCE(ecp.ended_at, now()) - ecp.started_at)) -
  COALESCE((
    SELECT SUM(EXTRACT(EPOCH FROM (
      LEAST(COALESCE(ch.resumed_at, COALESCE(ecp.ended_at, now())), COALESCE(ecp.ended_at, now())) -
      GREATEST(ch.held_at, ecp.started_at)
    )))
    FROM case_holds ch
    WHERE ch.ticket_id = ecp.ticket_id
      AND ch.held_at < COALESCE(ecp.ended_at, now())
      AND COALESCE(ch.resumed_at, COALESCE(ecp.ended_at, now())) > ecp.started_at
  ), 0)
)`;
