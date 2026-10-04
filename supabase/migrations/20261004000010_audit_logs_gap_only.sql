-- Requested: the audit trail (who created/edited what, and the diffs) is
-- visible to "gap" only — everyone can still view/edit transactions
-- themselves, this just narrows who sees the history behind them.
drop policy if exists audit_logs_select on audit_logs;

create policy audit_logs_select on audit_logs
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.username = 'gap'
    )
  );
