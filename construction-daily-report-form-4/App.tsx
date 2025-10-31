import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useHistoryState } from './utils/useHistoryState';
import { INITIAL_STATE } from './constants';
import { DailyLogState, WeatherReport } from './types';
import { exportPdf } from './utils/pdfExporter';
import { getWeatherDataForDate } from './utils/weatherService';
import { generateCaptionForImage, generateWeatherComment, rewriteText } from './utils/aiUtils';

import Sidebar from './components/Sidebar';
import SectionCard from './components/SectionCard';
import DynamicTable from './components/DynamicTable';
import PhotoLog from './components/PhotoLog';
import GeminiButton from './components/GeminiButton';
import CopyFromDateModal from './components/CopyFromDateModal';
import SaveStatusIndicator, { SaveStatus } from './components/SaveStatusIndicator';
import {
  MenuIcon, SunIcon, UsersIcon, CubeIcon, ScaleIcon, ClockIcon, ExclamationIcon,
  IdentificationIcon, TruckIcon, DocumentTextIcon, PhotographIcon, SparklesIcon, SavingIcon
} from './components/icons';
import IconButton from './components/IconButton';

// Utility function moved outside the component to prevent recreation on render.
const genId = () => Math.random().toString(36).substring(2, 15);

// Type assertion for table keys
type TableKey = keyof Pick<DailyLogState, 'manpower' | 'concrete' | 'steel' | 'delay' | 'accident' | 'visitor' | 'rental' | 'notes'>;

const App: React.FC = () => {
  const { state, setState, undo, redo, canUndo, canRedo, resetState } = useHistoryState<DailyLogState>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeSection, setActiveSection] = useState('report-details');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [rewritingCell, setRewritingCell] = useState<{ tableKey: TableKey, itemId: string, field: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sections = useMemo(() => [
    { id: 'report-details', title: 'Report Details', icon: <DocumentTextIcon /> },
    { id: 'weather', title: 'Weather', icon: <SunIcon /> },
    { id: 'manpower', title: 'Manpower', icon: <UsersIcon /> },
    { id: 'concrete', title: 'Concrete', icon: <CubeIcon /> },
    { id: 'steel', title: 'Steel', icon: <ScaleIcon /> },
    { id: 'delay', title: 'Delays', icon: <ClockIcon /> },
    { id: 'accident', title: 'Accidents', icon: <ExclamationIcon /> },
    { id: 'visitor', title: 'Visitors', icon: <IdentificationIcon /> },
    { id: 'rental', title: 'Rentals & Deliveries', icon: <TruckIcon /> },
    { id: 'notes', title: 'Notes & Issues', icon: <DocumentTextIcon /> },
    { id: 'photos', title: 'Photo Log', icon: <PhotographIcon /> },
  ], []);

  // Auto-save logic
  useEffect(() => {
    // Don't save the initial state on mount
    if (state === INITIAL_STATE) return;

    setSaveStatus('saving');
    const handler = setTimeout(() => {
      localStorage.setItem(`dailyLog_${state.reportDate}`, JSON.stringify(state));
      setSaveStatus('saved');
      const hideHandler = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(hideHandler);
    }, 1500); // Debounce for 1.5s

    return () => clearTimeout(handler);
  }, [state]);

  // Load data on date change
  useEffect(() => {
    const savedData = localStorage.getItem(`dailyLog_${state.reportDate}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && typeof parsedData === 'object') {
          const sanitizedState: DailyLogState = {
            ...INITIAL_STATE,
            ...parsedData,
            weather: { ...INITIAL_STATE.weather, ...(parsedData.weather || {}) },
            manpower: Array.isArray(parsedData.manpower) ? parsedData.manpower : [],
            concrete: Array.isArray(parsedData.concrete) ? parsedData.concrete : [],
            steel: Array.isArray(parsedData.steel) ? parsedData.steel : [],
            delay: Array.isArray(parsedData.delay) ? parsedData.delay : [],
            accident: Array.isArray(parsedData.accident) ? parsedData.accident : [],
            visitor: Array.isArray(parsedData.visitor) ? parsedData.visitor : [],
            rental: Array.isArray(parsedData.rental) ? parsedData.rental : [],
            notes: Array.isArray(parsedData.notes) ? parsedData.notes : [],
            photos: Array.isArray(parsedData.photos) ? parsedData.photos : [],
          };
          resetState(sanitizedState);
        } else {
          throw new Error("Invalid data format");
        }
      } catch (error) {
        console.error("Failed to load or parse saved data, resetting state.", error);
        localStorage.removeItem(`dailyLog_${state.reportDate}`);
        resetState({ ...INITIAL_STATE, reportDate: state.reportDate });
      }
    } else {
      resetState({
        ...INITIAL_STATE,
        reportDate: state.reportDate,
      });
    }
    setSelectedItems({});
  }, [state.reportDate, resetState]);


  // Intersection observer for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(section => {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach(section => {
        const el = sectionRefs.current[section.id];
        if (el) observer.unobserve(el);
      });
    };
  }, [sections]);
  
  const handleGenericChange = useCallback(<K extends keyof DailyLogState>(
    field: K,
    value: React.SetStateAction<DailyLogState[K]>
  ) => {
    setState(prev => ({ 
        ...prev, 
        [field]: typeof value === 'function' 
            ? (value as (prevState: DailyLogState[K]) => DailyLogState[K])(prev[field])
            : value 
    }));
  }, [setState]);

  const handleItemChange = useCallback(<K extends TableKey, V>(tableKey: K, itemId: string, field: keyof DailyLogState[K][number], value: V) => {
      setState(prev => ({
          ...prev,
          [tableKey]: (prev[tableKey] as any[]).map(item => 
              item.id === itemId ? { ...item, [field]: value } : item
          )
      }));
  }, [setState]);

  const handleSelectionChange = (tableKey: string, newSelectedIds: string[]) => {
    setSelectedItems(prev => ({
      ...prev,
      [tableKey]: newSelectedIds,
    }));
  };

  const handleDeleteSelected = (tableKey: TableKey, idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;
    setState(prev => ({
        ...prev,
        [tableKey]: (prev[tableKey] as any[]).filter(item => !idsToDelete.includes(item.id))
    }));
    handleSelectionChange(tableKey, []);
  };

  const handleWeatherChange = (field: keyof DailyLogState['weather'], value: string) => {
    setState(prev => ({
      ...prev,
      weather: { ...prev.weather, [field]: value },
    }));
  };
  
  const handleRewriteText = async <K extends TableKey>(
    tableKey: K,
    itemId: string,
    field: keyof DailyLogState[K][number],
    currentText: string
  ) => {
      setRewritingCell({ tableKey, itemId, field: field as string });
      try {
        const newText = await rewriteText(currentText);
        handleItemChange(tableKey, itemId, field, newText);
      } catch (error) {
          console.error("Failed to rewrite text", error);
      } finally {
          setRewritingCell(null);
      }
  };


  const fetchWeather = useCallback(async () => {
    setIsFetchingWeather(true);
    try {
      const weatherData = await getWeatherDataForDate(state.reportDate, state.address);
      setState(prev => ({ ...prev, weather: { ...prev.weather, ...weatherData } }));
    } catch (error) {
      console.error("Failed to fetch weather data", error);
    } finally {
      setIsFetchingWeather(false);
    }
  }, [state.reportDate, state.address, setState]);
  
  const generateComment = async () => {
    setIsGeneratingComment(true);
    try {
        const comment = await generateWeatherComment(state.weather);
        handleWeatherChange('comments', comment);
    } catch (error) {
        console.error("Failed to generate comment", error);
    } finally {
        setIsGeneratingComment(false);
    }
  };

  const generateCaptions = async (photoIds: string[]) => {
    setIsGeneratingCaptions(true);
    const photosToUpdate = state.photos.filter(p => photoIds.includes(p.id));

    for(const photo of photosToUpdate) {
        try {
            const caption = await generateCaptionForImage(photo);
            setState(prev => ({
                ...prev,
                photos: prev.photos.map(p => p.id === photo.id ? {...p, caption} : p)
            }));
        } catch(e) {
            console.error(`Failed to generate caption for ${photo.id}`, e);
        }
    }
    setIsGeneratingCaptions(false);
  };
  
  const handleCopyFromPrevious = (dataToCopy: Partial<DailyLogState>) => {
    const sanitizedState = {
      ...INITIAL_STATE,
      ...dataToCopy,
      reportDate: state.reportDate,
      weather: { ...INITIAL_STATE.weather, ...(dataToCopy.weather || {}) },
      manpower: Array.isArray(dataToCopy.manpower) ? dataToCopy.manpower : [],
      concrete: Array.isArray(dataToCopy.concrete) ? dataToCopy.concrete : [],
      steel: Array.isArray(dataToCopy.steel) ? dataToCopy.steel : [],
      delay: Array.isArray(dataToCopy.delay) ? dataToCopy.delay : [],
      accident: Array.isArray(dataToCopy.accident) ? dataToCopy.accident : [],
      visitor: Array.isArray(dataToCopy.visitor) ? dataToCopy.visitor : [],
      rental: Array.isArray(dataToCopy.rental) ? dataToCopy.rental : [],
      notes: Array.isArray(dataToCopy.notes) ? dataToCopy.notes : [],
      photos: Array.isArray(dataToCopy.photos) ? dataToCopy.photos : [],
    };
    resetState(sanitizedState);
  };

  const getRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };
  
  const renderTextInput = useCallback((value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onRewrite: () => void, isRewriting: boolean) => {
    return (
        <div className="relative w-full group">
            <input type="text" spellCheck={true} value={value} onChange={onChange} className="w-full p-1 bg-transparent border-none focus:ring-0 pr-8" />
            <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                <IconButton onClick={onRewrite} disabled={isRewriting || !value} className="text-slate-400 hover:text-purple-500">
                    {isRewriting ? <SavingIcon/> : <SparklesIcon />}
                </IconButton>
            </div>
        </div>
    );
  }, []);
  
  const renderTextArea = useCallback((value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, onRewrite: () => void, isRewriting: boolean) => {
    return (
        <div className="relative w-full group">
            <textarea spellCheck={true} value={value} onChange={onChange} className="w-full p-1 bg-transparent border-none focus:ring-0 pr-8" rows={2}/>
            <div className="absolute top-1 right-0 flex items-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                 <IconButton onClick={onRewrite} disabled={isRewriting || !value} className="text-slate-400 hover:text-purple-500">
                    {isRewriting ? <SavingIcon/> : <SparklesIcon />}
                </IconButton>
            </div>
        </div>
    );
  }, []);

  const manpowerColumns = useMemo(() => [
    { header: 'Company', render: (item: any) => renderTextInput(item.company, e => handleItemChange('manpower', item.id, 'company', e.target.value), () => handleRewriteText('manpower', item.id, 'company', item.company), rewritingCell?.tableKey === 'manpower' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'company'), className: "w-1/6" },
    { header: 'Trades', render: (item: any) => renderTextInput(item.trades, e => handleItemChange('manpower', item.id, 'trades', e.target.value), () => handleRewriteText('manpower', item.id, 'trades', item.trades), rewritingCell?.tableKey === 'manpower' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'trades'), className: "w-1/6" },
    { header: 'Manpower', render: (item: any) => <input type="number" value={item.manpower} onChange={e => handleItemChange('manpower', item.id, 'manpower', parseInt(e.target.value, 10) || 0)} className="w-full p-1 bg-transparent border-none focus:ring-0"/>, className: "w-1/12" },
    { header: 'Work Done', render: (item: any) => renderTextInput(item.workDone, e => handleItemChange('manpower', item.id, 'workDone', e.target.value),() => handleRewriteText('manpower', item.id, 'workDone', item.workDone), rewritingCell?.tableKey === 'manpower' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'workDone'), className: "w-1/3" },
    { header: 'Major Equipment', render: (item: any) => renderTextInput(item.majorEquipment, e => handleItemChange('manpower', item.id, 'majorEquipment', e.target.value),() => handleRewriteText('manpower', item.id, 'majorEquipment', item.majorEquipment), rewritingCell?.tableKey === 'manpower' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'majorEquipment') },
  ], [handleItemChange, rewritingCell, renderTextInput]);

  const newItemManpower = useCallback(() => ({ id: genId(), company: '', trades: '', manpower: 0, workDone: '', majorEquipment: '' }), []);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <Sidebar sections={sections} activeSection={activeSection} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pl-64 transition-all duration-300 ease-in-out">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-1 text-slate-500 dark:text-slate-400">
              <MenuIcon />
            </button>
            <h1 className="text-2xl font-bold">Construction Daily Log</h1>
          </div>
          <div className="flex items-center gap-4">
            <SaveStatusIndicator status={saveStatus} />
             <div className="flex items-center gap-2">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="px-3 py-1.5 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50"
                >Undo</button>
                 <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="px-3 py-1.5 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50"
                >Redo</button>
            </div>
            <button onClick={() => exportPdf(state)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">
              Export PDF
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <SectionCard id="report-details" ref={getRef('report-details')} title="Report Details" actions={
                <button onClick={() => setIsCopyModalOpen(true)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Copy from previous...
                </button>
            }>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="reportDate" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Report Date</label>
                        <input type="date" id="reportDate" value={state.reportDate} onChange={e => handleGenericChange('reportDate', e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="project" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Project Name</label>
                        <input type="text" id="project" spellCheck={true} value={state.project} onChange={e => handleGenericChange('project', e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Project Address</label>
                        <input type="text" id="address" spellCheck={true} value={state.address} onChange={e => handleGenericChange('address', e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md"/>
                    </div>
                </div>
            </SectionCard>

            <SectionCard id="weather" ref={getRef('weather')} title="Weather" actions={
              <button onClick={fetchWeather} disabled={isFetchingWeather} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50">
                {isFetchingWeather ? 'Fetching...' : 'Fetch Weather Data'}
              </button>
            }>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries({lowTemp: "Low Temp (°C)", highTemp: "High Temp (°C)", avgWind: "Avg Wind (km/h)", maxWind: "Max Wind (km/h)", morning: "Morning", afternoon: "Afternoon", evening: "Evening"}).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium">{label}</label>
                      <input type="text" value={state.weather[key as keyof WeatherReport]} onChange={e => handleWeatherChange(key as keyof WeatherReport, e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md"/>
                    </div>
                  ))}
               </div>
               <div className="mt-4">
                  <label className="block text-sm font-medium">Comments</label>
                  <div className="relative">
                    <textarea value={state.weather.comments} spellCheck={true} onChange={e => handleWeatherChange('comments', e.target.value)} rows={3} className="mt-1 w-full p-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md"/>
                    <div className="absolute bottom-2 right-2">
                        <GeminiButton onClick={generateComment} isLoading={isGeneratingComment}>Generate</GeminiButton>
                    </div>
                  </div>
               </div>
            </SectionCard>

            <SectionCard id="manpower" ref={getRef('manpower')} title="Manpower Log">
              <DynamicTable 
                items={state.manpower} 
                setItems={items => handleGenericChange('manpower', items)} 
                newItemFactory={newItemManpower}
                columns={manpowerColumns}
                selectedItems={selectedItems.manpower || []}
                onSelectionChange={(ids) => handleSelectionChange('manpower', ids)}
                onDeleteSelected={(ids) => handleDeleteSelected('manpower', ids)}
              />
            </SectionCard>
            
            <SectionCard id="concrete" ref={getRef('concrete')} title="Concrete Log">
                <DynamicTable 
                  items={state.concrete} 
                  setItems={items => handleGenericChange('concrete', items)} 
                  newItemFactory={() => ({ id: genId(), building: '', orderNumber: '', previousVolume: '', date: state.reportDate, concreteMix: '', application: '', location: '', volumeAddedToday: '', newTotalVolume: '' })} 
                  columns={[
                    { header: 'Building', render: (item: any) => renderTextInput(item.building, e => handleItemChange('concrete', item.id, 'building', e.target.value), () => handleRewriteText('concrete', item.id, 'building', item.building), rewritingCell?.tableKey === 'concrete' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'building') },
                    { header: 'Order #', render: (item: any) => <input value={item.orderNumber} onChange={e => handleItemChange('concrete', item.id, 'orderNumber', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'Date', render: (item: any) => <input type="date" value={item.date} onChange={e => handleItemChange('concrete', item.id, 'date', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'Mix', render: (item: any) => renderTextInput(item.concreteMix, e => handleItemChange('concrete', item.id, 'concreteMix', e.target.value), () => handleRewriteText('concrete', item.id, 'concreteMix', item.concreteMix), rewritingCell?.tableKey === 'concrete' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'concreteMix') },
                    { header: 'Application', render: (item: any) => renderTextInput(item.application, e => handleItemChange('concrete', item.id, 'application', e.target.value), () => handleRewriteText('concrete', item.id, 'application', item.application), rewritingCell?.tableKey === 'concrete' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'application') },
                    { header: 'Location', render: (item: any) => renderTextInput(item.location, e => handleItemChange('concrete', item.id, 'location', e.target.value), () => handleRewriteText('concrete', item.id, 'location', item.location), rewritingCell?.tableKey === 'concrete' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'location') },
                    { header: 'Vol. Added', render: (item: any) => <input value={item.volumeAddedToday} onChange={e => handleItemChange('concrete', item.id, 'volumeAddedToday', e.target.value)} className="w-full p-1 bg-transparent"/> },
                  ]}
                  selectedItems={selectedItems.concrete || []}
                  onSelectionChange={(ids) => handleSelectionChange('concrete', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('concrete', ids)}
                />
            </SectionCard>

            <SectionCard id="steel" ref={getRef('steel')} title="Steel Log">
                <DynamicTable 
                  items={state.steel} 
                  setItems={items => handleGenericChange('steel', items)} 
                  newItemFactory={() => ({ id: genId(), building: '', orderNumber: '', previousWeight: '', date: state.reportDate, location: '', totalWeightAddedToday: '', newTotalWeight: '' })} 
                  columns={[
                    { header: 'Building', render: (item: any) => renderTextInput(item.building, e => handleItemChange('steel', item.id, 'building', e.target.value), () => handleRewriteText('steel', item.id, 'building', item.building), rewritingCell?.tableKey === 'steel' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'building') },
                    { header: 'Order #', render: (item: any) => <input value={item.orderNumber} onChange={e => handleItemChange('steel', item.id, 'orderNumber', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'Date', render: (item: any) => <input type="date" value={item.date} onChange={e => handleItemChange('steel', item.id, 'date', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'Location', render: (item: any) => renderTextInput(item.location, e => handleItemChange('steel', item.id, 'location', e.target.value), () => handleRewriteText('steel', item.id, 'location', item.location), rewritingCell?.tableKey === 'steel' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'location') },
                    { header: 'Weight Added', render: (item: any) => <input value={item.totalWeightAddedToday} onChange={e => handleItemChange('steel', item.id, 'totalWeightAddedToday', e.target.value)} className="w-full p-1 bg-transparent"/> },
                  ]}
                  selectedItems={selectedItems.steel || []}
                  onSelectionChange={(ids) => handleSelectionChange('steel', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('steel', ids)}
                />
            </SectionCard>

            <SectionCard id="delay" ref={getRef('delay')} title="Delay Log">
                <DynamicTable 
                  items={state.delay} 
                  setItems={items => handleGenericChange('delay', items)} 
                  newItemFactory={() => ({ id: genId(), delayType: '', comments: '' })} 
                  columns={[
                    { header: 'Delay Type', render: (item: any) => renderTextInput(item.delayType, e => handleItemChange('delay', item.id, 'delayType', e.target.value), () => handleRewriteText('delay', item.id, 'delayType', item.delayType), rewritingCell?.tableKey === 'delay' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'delayType') },
                    { header: 'Comments', render: (item: any) => renderTextInput(item.comments, e => handleItemChange('delay', item.id, 'comments', e.target.value), () => handleRewriteText('delay', item.id, 'comments', item.comments), rewritingCell?.tableKey === 'delay' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'comments') },
                  ]}
                  selectedItems={selectedItems.delay || []}
                  onSelectionChange={(ids) => handleSelectionChange('delay', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('delay', ids)}
                />
            </SectionCard>

            <SectionCard id="accident" ref={getRef('accident')} title="Accident Log">
                <DynamicTable 
                  items={state.accident} 
                  setItems={items => handleGenericChange('accident', items)} 
                  newItemFactory={() => ({ id: genId(), details: '' })} 
                  columns={[
                    { header: 'Details', render: (item: any) => renderTextArea(item.details, e => handleItemChange('accident', item.id, 'details', e.target.value), () => handleRewriteText('accident', item.id, 'details', item.details), rewritingCell?.tableKey === 'accident' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'details') },
                  ]}
                  selectedItems={selectedItems.accident || []}
                  onSelectionChange={(ids) => handleSelectionChange('accident', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('accident', ids)}
                />
            </SectionCard>

            <SectionCard id="visitor" ref={getRef('visitor')} title="Visitor Log">
                <DynamicTable 
                  items={state.visitor} 
                  setItems={items => handleGenericChange('visitor', items)} 
                  newItemFactory={() => ({ id: genId(), visitor: '', startTime: '', endTime: '', details: '' })} 
                  columns={[
                    { header: 'Visitor', render: (item: any) => renderTextInput(item.visitor, e => handleItemChange('visitor', item.id, 'visitor', e.target.value), () => handleRewriteText('visitor', item.id, 'visitor', item.visitor), rewritingCell?.tableKey === 'visitor' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'visitor') },
                    { header: 'Start Time', render: (item: any) => <input type="time" value={item.startTime} onChange={e => handleItemChange('visitor', item.id, 'startTime', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'End Time', render: (item: any) => <input type="time" value={item.endTime} onChange={e => handleItemChange('visitor', item.id, 'endTime', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'Details', render: (item: any) => renderTextInput(item.details, e => handleItemChange('visitor', item.id, 'details', e.target.value), () => handleRewriteText('visitor', item.id, 'details', item.details), rewritingCell?.tableKey === 'visitor' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'details') },
                  ]}
                  selectedItems={selectedItems.visitor || []}
                  onSelectionChange={(ids) => handleSelectionChange('visitor', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('visitor', ids)}
                />
            </SectionCard>
            
            <SectionCard id="rental" ref={getRef('rental')} title="Rental & Delivery Log">
                <DynamicTable 
                  items={state.rental} 
                  setItems={items => handleGenericChange('rental', items)} 
                  newItemFactory={() => ({ id: genId(), time: '', deliveryFrom: '', trackingNumber: '', contents: '' })} 
                  columns={[
                    { header: 'Time', render: (item: any) => <input type="time" value={item.time} onChange={e => handleItemChange('rental', item.id, 'time', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'From', render: (item: any) => renderTextInput(item.deliveryFrom, e => handleItemChange('rental', item.id, 'deliveryFrom', e.target.value), () => handleRewriteText('rental', item.id, 'deliveryFrom', item.deliveryFrom), rewritingCell?.tableKey === 'rental' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'deliveryFrom') },
                    { header: 'Tracking #', render: (item: any) => <input value={item.trackingNumber} onChange={e => handleItemChange('rental', item.id, 'trackingNumber', e.target.value)} className="w-full p-1 bg-transparent"/> },
                    { header: 'Contents', render: (item: any) => renderTextInput(item.contents, e => handleItemChange('rental', item.id, 'contents', e.target.value), () => handleRewriteText('rental', item.id, 'contents', item.contents), rewritingCell?.tableKey === 'rental' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'contents') },
                  ]}
                  selectedItems={selectedItems.rental || []}
                  onSelectionChange={(ids) => handleSelectionChange('rental', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('rental', ids)}
                />
            </SectionCard>

            <SectionCard id="notes" ref={getRef('notes')} title="Notes & Issues Log">
                <DynamicTable 
                  items={state.notes} 
                  setItems={items => handleGenericChange('notes', items)} 
                  newItemFactory={() => ({ id: genId(), issue: '', comments: '', issueDetails: '' })} 
                  columns={[
                    { header: 'Issue', render: (item: any) => renderTextInput(item.issue, e => handleItemChange('notes', item.id, 'issue', e.target.value), () => handleRewriteText('notes', item.id, 'issue', item.issue), rewritingCell?.tableKey === 'notes' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'issue') },
                    { header: 'Comments', render: (item: any) => renderTextInput(item.comments, e => handleItemChange('notes', item.id, 'comments', e.target.value), () => handleRewriteText('notes', item.id, 'comments', item.comments), rewritingCell?.tableKey === 'notes' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'comments') },
                    { header: 'Details', render: (item: any) => renderTextInput(item.issueDetails, e => handleItemChange('notes', item.id, 'issueDetails', e.target.value), () => handleRewriteText('notes', item.id, 'issueDetails', item.issueDetails), rewritingCell?.tableKey === 'notes' && rewritingCell?.itemId === item.id && rewritingCell?.field === 'issueDetails') },
                  ]}
                  selectedItems={selectedItems.notes || []}
                  onSelectionChange={(ids) => handleSelectionChange('notes', ids)}
                  onDeleteSelected={(ids) => handleDeleteSelected('notes', ids)}
                />
            </SectionCard>
            
            <PhotoLog
              ref={getRef('photos')}
              photos={state.photos}
              setPhotos={photos => handleGenericChange('photos', photos)}
              onGenerateCaptions={generateCaptions}
              isGeneratingCaptions={isGeneratingCaptions}
            />

        </div>
      </main>
      <CopyFromDateModal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} onCopy={handleCopyFromPrevious} />
    </div>
  );
}

export default App;