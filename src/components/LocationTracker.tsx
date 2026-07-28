'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api-client'

// Calculate distance between two coordinates in meters (Haversine formula)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const THROTTLE_MS = 60000 // Gửi tối đa 1 lần mỗi 60 giây
const MIN_DISTANCE_M = 50 // Chỉ gửi khi di chuyển >= 50m

export function LocationTracker() {
  const { data: session, status } = useSession()
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(null)

  useEffect(() => {
    // Chỉ tracking khi đã đăng nhập và trình duyệt hỗ trợ geolocation
    if (status !== 'authenticated' || !session?.user?.id) return
    if (!('geolocation' in navigator)) return

    let watchId: number

    const sendLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      const now = Date.now()
      const last = lastSentRef.current

      // Throttle: bỏ qua nếu gửi cách đây chưa đủ 60 giây
      if (last && (now - last.time) < THROTTLE_MS) return

      // Distance filter: bỏ qua nếu chưa di chuyển đủ 50m
      if (last && getDistanceMeters(last.lat, last.lng, latitude, longitude) < MIN_DISTANCE_M) return

      try {
        await apiClient.post('/user-locations', {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        })
        lastSentRef.current = { lat: latitude, lng: longitude, time: now }
      } catch (error) {
        console.error('Failed to send location:', error)
      }
    }

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      (position) => sendLocation(position),
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      }
    )

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [status, session?.user?.id])

  return null
}
