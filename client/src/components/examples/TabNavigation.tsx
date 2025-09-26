import { useState } from 'react';
import TabNavigation from '../TabNavigation';

export default function TabNavigationExample() {
  const [activeTab, setActiveTab] = useState('inventory');
  
  return <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />;
}