import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-xl font-display font-bold text-white">BloomsCafe</span>
            <p className="mt-3 text-sm leading-relaxed">
              Handcrafted coffees, teas, and pastries made from the finest ingredients.
              Every sip blooms with flavor.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/menu" className="hover:text-white transition-colors">Menu</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Hours</h3>
            <ul className="space-y-2 text-sm">
              <li>Mon - Fri: 6:00 AM - 8:00 PM</li>
              <li>Sat - Sun: 7:00 AM - 9:00 PM</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          &copy; {new Date().getFullYear()} BloomsCafe. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
