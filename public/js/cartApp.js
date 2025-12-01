(function () {
  const e = React.createElement;

  function CartApp() {
    const [products, setProducts] = React.useState(window.__INITIAL_PRODUCTS__ || []);
    const [cart, setCart] = React.useState([]);
    const [user, setUser] = React.useState(null);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
      fetch('/api/me')
        .then(r => r.json())
        .then(data => {
          if (data.loggedIn) setUser(data.user);
        });
    }, []);

    const getProduct = id => products.find(p => p.id === id);

    const addToCart = (productId) => {
      setCart(prev => {
        const found = prev.find(p => p.productId === productId);
        if (found) {
          return prev.map(p =>
            p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p
          );
        }
        return [...prev, { productId, quantity: 1 }];
      });
    };

    const changeQty = (productId, delta) => {
      setCart(prev =>
        prev
          .map(p =>
            p.productId === productId
              ? { ...p, quantity: p.quantity + delta }
              : p
          )
          .filter(p => p.quantity > 0)
      );
    };

    const removeFromCart = (productId) => {
      setCart(prev => prev.filter(p => p.productId !== productId));
    };

    const total = cart.reduce((sum, item) => {
      const p = getProduct(item.productId);
      return sum + (p ? p.precio * item.quantity : 0);
    }, 0);

    const handleCheckout = () => {
      setMessage('');
      if (cart.length === 0) {
        setMessage('El carrito está vacío.');
        return;
      }

      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      })
        .then(async r => {
          if (r.status === 401) {
            window.location.href = '/auth/login';
            return null;
          }
          return r.json();
        })
        .then(data => {
          if (!data) return;
          if (data.ok) {
            alert('Compra realizada con éxito');
            window.open('/ticket/' + data.orderId, '_blank');
            setCart([]);
          } else if (data.error) {
            setMessage(data.error);
          }
        })
        .catch(() => setMessage('Error al procesar la compra.'));
    };

    return e('div', { className: 'shop-layout' },
      e('section', { className: 'products' },
        e('div', { className: 'product-grid' },
          products.map(p =>
            e('div', { key: p.id, className: 'product-card' },
              e('a', { href: p.imagen, target: '_blank', rel: 'noreferrer' },
                e('div', { className: 'img-placeholder' }, 'Ver imagen')
              ),
              e('h3', null, p.nombre),
              e('p', { className: 'categoria' }, p.categoria),
              e('p', { className: 'precio' }, '$ ' + p.precio + ' MXN'),
              e('button', { onClick: () => addToCart(p.id) }, 'Agregar')
            )
          )
        )
      ),
      e('aside', { className: 'cart' },
        e('h2', null, 'Carrito'),
        cart.length === 0
          ? e('p', null, 'No hay productos')
          : e('ul', { className: 'cart-list' },
              cart.map(item => {
                const p = getProduct(item.productId);
                if (!p) return null;
                return e('li', { key: item.productId, className: 'cart-item' },
                  e('div', { className: 'cart-name' }, p.nombre),
                  e('div', { className: 'cart-controls' },
                    e('button', { onClick: () => changeQty(item.productId, -1) }, '-'),
                    e('span', { className: 'qty' }, item.quantity),
                    e('button', { onClick: () => changeQty(item.productId, 1) }, '+'),
                    e('button', { className: 'remove-btn', onClick: () => removeFromCart(item.productId) }, 'Quitar')
                  ),
                  e('div', { className: 'cart-subtotal' },
                    '$ ' + (p.precio * item.quantity) + ' MXN'
                  )
                );
              })
            ),
        e('div', { className: 'cart-total' },
          e('span', null, 'Total:'),
          e('strong', null, '$ ' + total + ' MXN')
        ),
        e('button', { className: 'checkout-btn', onClick: handleCheckout }, 'Comprar'),
        message && e('p', { className: 'message' }, message),
        !user && e('p', { className: 'login-hint' }, 'Debes iniciar sesión para completar la compra.')
      )
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
      ReactDOM.createRoot(root).render(React.createElement(CartApp));
    }
  });
})();
