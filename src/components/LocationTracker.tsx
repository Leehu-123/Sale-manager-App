'use client'

import { useEffect } from 'react'

export function LocationTracker() {
  useEffect(() => {
    // Only track if geolocation is supported
    if (!('geolocation' in navigator)) {
      return
    }

    let watchId: number

    const token = localStorage.getItem('token')
    if (!token) {
      return // Do not track if not logged in
    }

    const sendLocation = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude, accuracy } = position.coords
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/user-locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude,
            longitude,
            accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          }),
        })
      } catch (error) {
        console.error('Failed to send location:', error)
      }
    }

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        sendLocation(position)
      },
      (error) => {
        console.error('Error watching location:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    )

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  return null
}
