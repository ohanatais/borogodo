alter table public.preparation_events
  drop constraint preparation_events_event_name_check;

alter table public.preparation_events
  add constraint preparation_events_event_name_check check (event_name in (
    'moment_selected', 'context_submitted', 'evidence_opened',
    'preparation_saved', 'conversation_shared', 'conversation_summarized',
    'response_feedback'
  ));
