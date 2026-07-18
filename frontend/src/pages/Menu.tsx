import { useCallback, useEffect, useState } from 'react'
import type { Category, Product } from '../types'
import { fetchCategories } from '../api/categoryApi'
import { fetchProducts, fetchProductsByCategory } from '../api/productApi'
import useCartStore from '../store/cartStore'
import Pagination from '../components/ui/Pagination'

export default function Menu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [addedId, setAddedId] = useState<number | null>(null)

  const addItem = useCartStore((s) => s.addItem)

  const loadProducts = useCallback(() => {
    setLoading(true)
    setError(false)
    const load = activeCategory
      ? fetchProductsByCategory(activeCategory, page)
      : fetchProducts(page)
    load
      .then((data) => {
        setProducts(data.content)
        setTotalPages(data.totalPages)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [activeCategory, page])

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    function onFocus() { loadProducts() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadProducts])

  function handleCategoryClick(categoryId: number | null) {
    setActiveCategory(categoryId)
    setPage(0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Our Menu</h1>

      <div className="flex gap-8">
        <aside className="w-56 shrink-0">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Categories
          </h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleCategoryClick(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === null
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Items
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">Failed to load menu. Check your connection.</p>
              <button onClick={loadProducts} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No products found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                    <div className="mb-1">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                        {product.category.name}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {product.stockQuantity > 0
                        ? `${product.stockQuantity} in stock`
                        : 'Out of stock'}
                    </p>
                    <button
                      onClick={() => {
                        addItem(product)
                        setAddedId(product.id)
                        setTimeout(() => setAddedId(null), 1500)
                      }}
                      disabled={product.stockQuantity === 0}
                      className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {addedId === product.id ? 'Added!' : product.stockQuantity > 0 ? 'Add to Cart' : 'Unavailable'}
                    </button>
                  </div>
                  </div>
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
