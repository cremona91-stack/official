import AppHeader from '../AppHeader';

export default function AppHeaderExample() {
  return <AppHeader onExportPDF={() => console.log('PDF export example')} />;
}