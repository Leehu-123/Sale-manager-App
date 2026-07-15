'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { apiClient } from '@/lib/api-client'
import { MapPin, Clock } from 'lucide-react'

interface UserLocation {
  id: string
  latitude: number
  longitude: number
  timestamp: string
}

export function UserRouteModal({ isOpen, onClose, userId, userName }: { isOpen: boolean, onClose: () => void, userId: string, userName: string }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchRoute()
    }
  }, [isOpen, userId, date])

  const fetchRoute = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/user-locations?userId=${userId}&date=${date}`)
      setLocations(res.data || res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tua tuyến: ${userName}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Chọn ngày</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="w-full border border-surface-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-surface-50 rounded-lg p-4 max-h-[400px] overflow-y-auto border border-surface-200">
          {loading ? (
            <div className="flex justify-center py-8"><div className="spinner w-6 h-6 border-2" /></div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-surface-500">
              <MapPin className="mx-auto h-8 w-8 text-surface-300 mb-2" />
              <p>Không có dữ liệu vị trí trong ngày này.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-brand-200 ml-3 pl-4 space-y-6">
              {locations.map((loc, i) => (
                <div key={loc.id} className="relative">
                  <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
                  <div className="text-sm font-medium text-surface-900 flex items-center gap-1">
                    <Clock size={14} className="text-surface-400" />
                    {new Date(loc.timestamp).toLocaleTimeString('vi-VN')}
                  </div>
                  <div className="text-sm mt-1">
                    <a 
                      href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <MapPin size={14} /> Mở trên Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
