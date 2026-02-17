import { Link } from 'react-router-dom';
import { Sparkles, Palette, Truck, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Palette,
    title: 'Intuitive Design Editor',
    description: 'Our Instagram-style canvas editor makes designing custom t-shirts fun and easy.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Designs',
    description: 'Generate unique designs with AI. Just describe what you want and watch it come to life.',
  },
  {
    icon: Truck,
    title: 'Fast Shipping',
    description: 'Get your custom t-shirts delivered quickly with our express shipping options.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guaranteed',
    description: 'Premium materials and printing ensure your designs look amazing and last long.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Design Your Perfect
              <br />
              Custom T-Shirt
            </h1>
            <p className="mt-6 text-xl text-primary-100">
              Create unique, personalized t-shirts with our powerful design editor.
              Upload images, add text, or let AI generate stunning designs for you.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/design">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                  Start Designing
                </Button>
              </Link>
              <Link to="/design">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Try AI Generator
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-50" style={{
          clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 100%)'
        }} />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to Create
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful tools, simple interface, amazing results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600">Create your custom t-shirt in 3 easy steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Design</h3>
              <p className="text-gray-600">
                Use our design editor to create your perfect t-shirt. Upload images, add text, or
                generate designs with AI.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customize</h3>
              <p className="text-gray-600">
                Choose your t-shirt style, color, size, and material. See real-time pricing as you
                customize.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Order</h3>
              <p className="text-gray-600">
                Add to cart, checkout securely, and we'll print and ship your custom t-shirt right
                to your door.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/design">
              <Button size="lg">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Something Amazing?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of happy customers who have created their perfect custom t-shirts with
            TeeDesigner.
          </p>
          <Link to="/design">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Start Your Design
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} TeeDesigner. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Built with React, Node.js, and love.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
