import { PageStub } from '../components/PageStub';
import { Package } from 'lucide-react';

export function InventoryPage() {
  return <PageStub title="Stock" icon={Package} description="Gestion FIFO des stocks, audits, mouvements." />;
}