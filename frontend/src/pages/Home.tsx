import { Link } from 'react-router-dom'

const featuredItems = [
  { name: 'Classic Latte', price: 4.50, category: 'Hot Beverages', desc: 'Espresso with steamed milk and a light layer of foam.', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80' },
  { name: 'Iced Mocha', price: 5.25, category: 'Cold Beverages', desc: 'Chilled espresso with chocolate and milk over ice.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { name: 'Chocolate Chip Cookie', price: 2.50, category: 'Pastries', desc: 'Warm, gooey cookie loaded with premium Belgian chocolate chips.', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { name: 'Tiramisu', price: 6.50, category: 'Desserts', desc: 'Classic Italian layered dessert with mascarpone and cocoa.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
]

const testimonials = [
  { text: 'Best coffee in town! The ambiance is perfect for working or catching up with friends.', author: 'Sarah M.' },
  { text: 'Their pastries are absolutely divine. The croissant tastes like it\'s straight from Paris.', author: 'James K.' },
  { text: 'I\'ve been coming here for years. The quality never wavers and the staff is always welcoming.', author: 'Emily R.' },
]

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-2xl">
            <span className="inline-block text-sm font-semibold text-amber-300 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
              Since 2020
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
              Where Every Sip
              <span className="text-amber-400"> Blooms </span>
              with Flavor
            </h1>
            <p className="mt-6 text-lg text-gray-200 leading-relaxed max-w-xl">
              Handcrafted coffees, teas, and pastries made from the finest ingredients.
              Experience the art of cafe culture at BloomsCafe.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                to="/menu"
                className="bg-amber-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-amber-600 transition-colors shadow-sm"
              >
                Explore Our Menu
              </Link>
              <Link
                to="/register"
                className="border-2 border-white/70 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white/10 transition-colors"
              >
                Join Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
              What We Offer
            </h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              From the first sip to the last bite, every detail matters.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Artisan Coffee',
                desc: 'Single-origin beans roasted to perfection for a rich, smooth cup that wakes up your senses.',
                image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
              },
              {
                title: 'Fresh Pastries',
                desc: 'Baked daily with premium ingredients — from flaky croissants to indulgent cakes and tarts.',
                image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&q=80',
              },
              {
                title: 'Cozy Ambiance',
                desc: 'The perfect spot to work, meet friends, or unwind with a book and your favorite brew.',
                image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
              },
            ].map((item) => (
              <div key={item.title} className="group rounded-xl overflow-hidden bg-white border border-gray-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
              Featured Items
            </h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              Customer favorites you need to try.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <div key={item.name} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="h-44 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-3 group-hover:text-primary-600 transition-colors">${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 font-semibold text-gray-900">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold text-white">
            Ready to Experience BloomsCafe?
          </h2>
          <p className="mt-3 text-primary-100 max-w-lg mx-auto">
            Join us today and get exclusive offers, loyalty rewards, and early access to new menu items.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
