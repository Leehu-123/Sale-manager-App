/* Trang chính - Chuyển hướng đến Dashboard */
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
