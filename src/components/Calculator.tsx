import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { HowMuchCanIBorrow } from './HowMuchCanIBorrow';
import { ExpandableTabs } from './ui/ExpandableTabs';
import type { CalculatorTab } from '../types';
import './Calculator.css';

export function Calculator() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('how-much-can-i-borrow');

  return (
    <div className="calculator">
      <nav className="calculator-tabs">
        <ExpandableTabs
          tabs={[{ title: 'How Much Can I Borrow', icon: Building2 }]}
          onChange={(index) => {
            if (index === 0) setActiveTab('how-much-can-i-borrow');
          }}
        />
      </nav>

      <main className="calculator-content">
        {activeTab === 'how-much-can-i-borrow' && <HowMuchCanIBorrow />}
      </main>

    </div>
  );
}
