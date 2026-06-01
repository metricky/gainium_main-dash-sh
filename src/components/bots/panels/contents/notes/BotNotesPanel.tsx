import NotesWidget, {
  type NotesWidgetProps,
} from '@/components/widgets/dashboard/NotesWidget';

export type BotNotesPanelProps = Omit<NotesWidgetProps, 'variant'>;

const BotNotesPanel: React.FC<BotNotesPanelProps> = (props) => {
  return <NotesWidget {...props} variant="panel" />;
};

BotNotesPanel.displayName = 'BotNotesPanel';

export default BotNotesPanel;
