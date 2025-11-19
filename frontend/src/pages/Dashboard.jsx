import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PanelAsistentes from './PanelAsistentes'
import CreateCampaign from './CreateCampaign'
import Home from './Home'
import DashboardMain from './DashboardMain'
import Finanzas from './Finanzas'
import Debugging from './Debugging'
import Talento from './Talento'
import Competencia from './Competencia'
import backgroundImage from '../assets/images/background.png'

const ComingSoon = ({ title }) => (
  <div className="p-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">Estamos trabajando en esta sección.</p>
    </div>
  </div>
)

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main 
        className="flex-1 overflow-y-auto"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'auto',
          backgroundPosition: 'top left',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        }}
      >
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardMain />} />
          <Route path="finanzas/*" element={<Finanzas />} />
          <Route path="competencia/*" element={<Competencia />} />
          <Route path="plantel" element={<Navigate to="talento/jugadores" replace />} />
          <Route path="talento/*" element={<Talento />} />
          <Route path="comunicaciones/web" element={<Home />} />
          <Route path="comunicaciones/prensa" element={<ComingSoon title="Prensa" />} />
          <Route path="comunicaciones/chats" element={<ComingSoon title="Chats" />} />
          <Route path="asistentes/*" element={<PanelAsistentes />} />
          <Route path="create-campaign" element={<CreateCampaign />} />
          <Route path="debugging" element={<Debugging />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default Dashboard

