begin;

alter table public.sessions
  add column if not exists queue_numbers_enabled boolean not null default false;

alter table public.sessions
  add column if not exists next_check_in_number bigint not null default 1;

alter table public.attendance
  add column if not exists check_in_number bigint;

create unique index if not exists attendance_session_check_in_number_idx
  on public.attendance(session_id, check_in_number)
  where check_in_number is not null;

create or replace function public.assign_attendance_check_in_number()
returns trigger
language plpgsql
as $$
begin
  if new.check_in_number is not null then
    return new;
  end if;

  update public.sessions
  set next_check_in_number = next_check_in_number + 1
  where id = new.session_id
    and queue_numbers_enabled = true
  returning next_check_in_number - 1 into new.check_in_number;

  return new;
end;
$$;

drop trigger if exists attendance_assign_check_in_number on public.attendance;

create trigger attendance_assign_check_in_number
before insert on public.attendance
for each row
execute function public.assign_attendance_check_in_number();

commit;
