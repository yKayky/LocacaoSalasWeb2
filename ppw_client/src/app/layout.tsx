import './globals.css';
import { ReservaProvider } from '@/components/reservas/reserva-provider';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata = { title: 'CoworkSpace', description: 'Sistema de Gestão de Salas e Espaços de Coworking' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ReservaProvider>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 p-6 md:p-8 overflow-auto">
              {children}
            </main>
          </div>
        </ReservaProvider>
      </body>
    </html>
  );
}
