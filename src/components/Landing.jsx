import { useState } from 'react';
import { useAssessment } from '../hooks/useAssessment';
import TaxonomyModal from './TaxonomyModal';
import HeroSection from './landing/HeroSection';
import HowItWorks from './landing/HowItWorks';
import Showcase from './landing/Showcase';
import ClosingSection from './landing/ClosingSection';

export default function Landing() {
  const { setScreen } = useAssessment();
  const [showTaxonomy, setShowTaxonomy] = useState(false);

  const handleStart = () => setScreen('questionnaire');
  const handleShowTaxonomy = () => setShowTaxonomy(true);

  return (
    <div className="min-h-screen bg-bg">
      <HeroSection onStart={handleStart} onShowTaxonomy={handleShowTaxonomy} />
      <HowItWorks />
      <Showcase />
      <ClosingSection onStart={handleStart} onShowTaxonomy={handleShowTaxonomy} />
      <TaxonomyModal isOpen={showTaxonomy} onClose={() => setShowTaxonomy(false)} />
    </div>
  );
}
