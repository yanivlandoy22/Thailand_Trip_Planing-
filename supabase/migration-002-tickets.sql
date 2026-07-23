-- Ticket PDFs: original booking confirmations attached to bookings.
-- Storage: private bucket `tickets`, object path {booking_id}.pdf.
-- Access is exclusively via server-generated signed URLs (service role);
-- storage.objects has no public policies so the bucket is unreachable directly.

alter table bookings add column if not exists ticket_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tickets', 'tickets', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
