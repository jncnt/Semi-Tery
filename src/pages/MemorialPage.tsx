import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Heart, Calendar, MapPin, Feather } from 'lucide-react';
import { getDisplayName } from '../lib/nameUtils';

const MemorialPage = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('burial_records')
        .select('*, plots(plot_number, section)')
        .eq('id', id)
        .single();
      
      if (error) console.error('Error:', error);
      else setRecord(data);
      setLoading(false);
    };

    fetchRecord();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white italic text-gray-400">Loading memorial...</div>;
  if (!record) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-600">Record not found.</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      {/* Respectful Header Cover */}
      <div className="h-64 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        <Feather className="text-gray-200" size={64} strokeWidth={1} />
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-32">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {record.photo_url ? (
              <img
                src={record.photo_url}
                alt={getDisplayName(record)}
                className="w-48 h-48 rounded-full border-4 border-white shadow-md object-cover mb-6"
              />
            ) : (
              <div className="w-48 h-48 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center mb-6">
                <Heart size={48} className="text-gray-200" />
              </div>
            )}
            
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{getDisplayName(record)}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-500 font-medium italic">
              <span>{record.birth_date ? format(new Date(record.birth_date), 'yyyy') : '...'}</span>
              <span>—</span>
              <span>{record.death_date ? format(new Date(record.death_date), 'yyyy') : '...'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-50">
            <div className="space-y-6 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <Calendar className="text-primary mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-gray-900 leading-none mb-1">Born</p>
                  <p>{record.birth_date ? format(new Date(record.birth_date), 'MMMM d, yyyy') : 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-primary mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-gray-900 leading-none mb-1">Passed Away</p>
                  <p>{record.death_date ? format(new Date(record.death_date), 'MMMM d, yyyy') : 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-gray-900 leading-none mb-1">Final Resting Place</p>
                  <p>Plot {record.plots?.plot_number || 'Unspecified'}</p>
                  <p className="text-xs uppercase tracking-wider">{record.plots?.section || 'Main Section'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-primary mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-gray-900 leading-none mb-1">Burial Date</p>
                  <p>{record.burial_date ? format(new Date(record.burial_date), 'MMMM d, yyyy') : 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-gray-50">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="text-red-400 fill-current" size={20} />
              Biography & Remembrance
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg italic">
              {record.biography || "In loving memory of a life well-lived. To live in hearts we leave behind is not to die."}
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>© 2024 CemeteryPro Memorial Services</p>
          <div className="mt-2 flex justify-center gap-4">
            <span className="cursor-pointer hover:text-gray-600">Privacy</span>
            <span>•</span>
            <span className="cursor-pointer hover:text-gray-600">Share</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorialPage;
