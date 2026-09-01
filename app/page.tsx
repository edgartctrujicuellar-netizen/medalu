"use client";

import React, { useState, useEffect } from "react";

// Interfaces del sistema
interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: string;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

const CATEGORIAS = [
  "Todos",
  "Bazar",
  "Ropa de Dama",
  "Alimentos",
  "Lácteos y Bebidas",
  "Limpieza",
  "Ofertas",
];

const PRODUCTOS_INICIALES: Producto[] = [
  {
    id: "p1",
    nombre: "Juego de Tazas de Cerámica",
    precio: 350,
    categoria: "Bazar",
    imagen: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
  },
  {
    id: "p2",
    nombre: "Yerba Mate 1kg",
    precio: 180,
    categoria: "Alimentos",
    imagen: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80",
  },
  {
    id: "p3",
    nombre: "Leche Entera 1L",
    precio: 45,
    categoria: "Lácteos y Bebidas",
    imagen: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
  },
];

const IMG_FALLBACK = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80";

export default function PaginaMedaluStore() {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  const [agotados, setAgotados] = useState<string[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos");
  const [cargandoServidor, setCargandoServidor] = useState<boolean>(true);

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [drawerAbierto, setDrawerAbierto] = useState<boolean>(false);

  // Modales
  const [modalCheckout, setModalCheckout] = useState<boolean>(false);
  const [modalLogin, setModalLogin] = useState<boolean>(false);
  const [modalAdmin, setModalAdmin] = useState<boolean>(false);

  // Formularios
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [clienteDireccion, setClienteDireccion] = useState<string>("");
  const [entrega, setEntrega] = useState<"tienda" | "delivery">("tienda");

  // Autenticación Dueña
  const [loginPass, setLoginPass] = useState<string>("");
  const [passGuardada, setPassGuardada] = useState<string>("Medalu2026");

  // Agregar Producto
  const [pNombre, setPNombre] = useState<string>("");
  const [pPrecio, setPPrecio] = useState<string>("");
  const [pCategoria, setPCategoria] = useState<string>("Bazar");
  const [pImagen, setPImagen] = useState<string>("");
  const [previewFoto, setPreviewFoto] = useState<string>("");

  useEffect(() => {
    async function sincronizarDesdeServidor() {
      try {
        const resp = await fetch("/api/productos");
        if (resp.ok) {
          const data = await resp.json();
          if (data.productos && data.productos.length > 0) setProductos(data.productos);
          if (data.agotados) setAgotados(data.agotados);
        }
      } catch (err) {
        const pLocales = localStorage.getItem("medalu_productos_global");
        if (pLocales) setProductos(JSON.parse(pLocales));
        const aLocales = localStorage.getItem("medalu_agotados_global");
        if (aLocales) setAgotados(JSON.parse(aLocales));
      } finally {
        setCargandoServidor(false);
      }
    }

    sincronizarDesdeServidor();
    const passLocal = localStorage.getItem("medalu_pass");
    if (passLocal) setPassGuardada(passLocal);
  }, []);

  const guardarEnServidorGlobal = async (nuevosProds: Producto[], nuevosAgotados: string[]) => {
    localStorage.setItem("medalu_productos_global", JSON.stringify(nuevosProds));
    localStorage.setItem("medalu_agotados_global", JSON.stringify(nuevosAgotados));

    try {
      await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: nuevosProds, agotados: nuevosAgotados }),
      });
    } catch (e) {
      console.log("Persistencia local activada.");
    }
  };

  const uy = (monto: number) => `$UY ${monto.toLocaleString("es-UY")}`;
  const estaAgotado = (id: string) => agotados.includes(id);

  const toggleStock = (id: string) => {
    const nuevosAgotados = estaAgotado(id)
      ? agotados.filter((aId) => aId !== id)
      : [...agotados, id];
    setAgotados(nuevosAgotados);
    guardarEnServidorGlobal(productos, nuevosAgotados);
  };

  const agregarAlCarrito = (id: string) => {
    const prod = productos.find((p) => p.id === id);
    if (!prod) return;

    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === id);
      if (existe) {
        return prev.map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...prod, cantidad: 1 }];
    });
    setDrawerAbierto(true);
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCant = item.cantidad + delta;
            return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
          }
          return item;
        })
        .filter(Boolean) as ItemCarrito[]
    );
  };

  const quitarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCarrito = () =>
    carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const totalItemsCount = () =>
    carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const enviarWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    let msg = `*Nuevo pedido en MEDALU STORE*\n\n`;
    msg += `*Cliente:* ${clienteNombre}\n`;
    msg += `*Método:* ${entrega === "tienda" ? "Retiro en Local (Ramón Trigo)" : "Envío a domicilio"}\n`;
    if (entrega === "delivery") msg += `*Dirección:* ${clienteDireccion}\n`;
    msg += `\n*Detalle del pedido:*\n`;

    carrito.forEach((i) => {
      msg += `• ${i.nombre} x${i.cantidad} - ${uy(i.precio * i.cantidad)}\n`;
    });

    msg += `\n*TOTAL: ${uy(totalCarrito())}*`;

    const url = `https://wa.me/59892828243?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const verificarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPass === passGuardada) {
      setModalLogin(false);
      setModalAdmin(true);
      setLoginPass("");
    } else {
      alert("Contraseña incorrecta.");
    }
  };

  const previsualizarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewFoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const imagenFinal = previewFoto || pImagen || IMG_FALLBACK;

    const nuevoProd: Producto = {
      id: "p_" + Date.now(),
      nombre: pNombre,
      precio: parseFloat(pPrecio) || 0,
      categoria: pCategoria,
      imagen: imagenFinal,
    };

    const listaActualizada = [nuevoProd, ...productos];
    setProductos(listaActualizada);
    await guardarEnServidorGlobal(listaActualizada, agotados);

    setPNombre("");
    setPPrecio("");
    setPCategoria("Bazar");
    setPImagen("");
    setPreviewFoto("");
    alert("¡Producto publicado globalmente con éxito!");
  };

  const eliminarProductoAdmin = async (id: string) => {
    if (confirm("¿Deseas eliminar este producto del catálogo general?")) {
      const listaActualizada = productos.filter((p) => p.id !== id);
      setProductos(listaActualizada);
      await guardarEnServidorGlobal(listaActualizada, agotados);
    }
  };

  const productosFiltrados =
    categoriaActiva === "Todos"
      ? productos
      : productos.filter((p) => p.categoria === categoriaActiva);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3E3D]">
      {/* ENCABEZADO MEDALU */}
      <header className="bg-[#F3EFEA] border-b border-[#E7E0D6] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.35em] text-[#4A3E3D] leading-none">
              MEDALU
            </h1>
            <p className="text-xs tracking-[0.3em] uppercase text-[#A8876A] mt-1">
              Tu tienda local
            </p>
          </div>
          <button
            className="bg-[#4A3E3D] hover:bg-[#2C2623] text-white px-5 py-2.5 rounded-full font-semibold transition relative cursor-pointer"
            onClick={() => setDrawerAbierto(true)}
          >
            Carrito
            <span className="absolute -top-1.5 -right-1.5 bg-[#A8876A] text-white text-[0.72rem] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
              {totalItemsCount()}
            </span>
          </button>
        </div>
      </header>

      {/* PORTADA PRINCIPAL */}
      <section className="max-w-[1200px] mx-auto pt-10 pb-2 px-5 text-center">
        <h2 className="text-xl sm:text-3xl font-bold mb-2">Tus productos al mejor precio</h2>
        <p className="text-[#A8876A] max-w-[560px] mx-auto">
          Artículos de Bazar, Ropa de dama, alimentos y todo para el hogar.
        </p>
      </section>

      {/* NAVEGACIÓN Y FILTROS */}
      <nav className="max-w-[1200px] mx-auto py-6 px-5 flex gap-2.5 flex-wrap justify-center">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer ${
              cat === categoriaActiva
                ? "bg-[#4A3E3D] text-white"
                : "bg-[#E7E0D6] text-[#4A3E3D] hover:bg-[#d6cbbe]"
            }`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* CATÁLOGOS */}
      <main className="max-w-[1200px] mx-auto px-5 py-5">
        {cargandoServidor ? (
          <p className="text-center py-16 text-[#A8876A]">Cargando tienda MEDALU...</p>
        ) : productosFiltrados.length === 0 ? (
          <p className="col-span-full text-center py-16 text-[#A8876A]">
            No hay productos en la categoría {categoriaActiva} por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
            {productosFiltrados.map((p) => {
              const agotado = estaAgotado(p.id);
              const imagen = p.imagen && p.imagen.trim() !== "" ? p.imagen : IMG_FALLBACK;

              return (
                <article
                  key={p.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border border-[#E7E0D6] flex flex-col relative transition hover:shadow-md ${
                    agotado ? "opacity-60" : ""
                  }`}
                >
                  {agotado && (
                    <span className="absolute top-6 right-6 bg-red-800 text-white text-xs px-2.5 py-1 rounded-full font-bold z-10">
                      Agotado
                    </span>
                  )}
                  <div className="w-full h-[200px] rounded-xl overflow-hidden bg-[#F3EFEA] mb-3">
                    <img
                      src={imagen}
                      alt={p.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = IMG_FALLBACK;
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-[0.7rem] tracking-[0.15em] uppercase text-[#A8876A] font-bold">
                      {p.categoria}
                    </span>
                    <span className="font-semibold text-[#4A3E3D]">{p.nombre}</span>
                    <span className="text-lg font-bold text-[#2C2623] mt-auto">
                      {uy(p.precio)}
                    </span>

                    {agotado ? (
                      <button
                        className="mt-2 w-full py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed"
                        disabled
                      >
                        Agotado
                      </button>
                    ) : (
                      <button
                        className="mt-2 w-full py-2 bg-[#4A3E3D] hover:bg-[#2C2623] text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                        onClick={() => agregarAlCarrito(p.id)}
                      >
                        Agregar al carrito
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center py-10 px-5 text-[#A8876A] text-sm">
        <div className="max-w-[640px] mx-auto mb-6 p-6 bg-white rounded-2xl shadow-sm border border-[#E7E0D6]">
          <h4 className="text-lg text-[#4A3E3D] font-bold mb-3 tracking-wide">
            Contacto y ubicación
          </h4>
          <ul className="list-none space-y-2 text-[#4A3E3D] text-sm">
            <li>Ramón Trigo, Cerro Largo, Uruguay</li>
            <li>
              WhatsApp:{" "}
              <a
                href="https://wa.me/59892828243"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-semibold"
              >
                92 828 243
              </a>
            </li>
          </ul>
        </div>
        <p>© {new Date().getFullYear()} Medalu · Tu tienda local.</p>
        <p className="mt-2">
          <button
            className="underline cursor-pointer bg-none border-none text-[#A8876A] font-semibold"
            onClick={() => setModalLogin(true)}
          >
            Panel Admin Dueña
          </button>
        </p>
      </footer>

      {/* DRAWER CARRITO */}
      {drawerAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setDrawerAbierto(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          drawerAbierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-[#E7E0D6] flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-wider">Tu Carrito</h3>
          <button className="text-2xl cursor-pointer" onClick={() => setDrawerAbierto(false)}>
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {carrito.length === 0 ? (
            <p className="text-center py-16 text-[#A8876A]">Tu carrito está vacío.</p>
          ) : (
            carrito.map((i) => (
              <div key={i.id} className="flex gap-3 items-center py-3 border-b border-[#E7E0D6]">
                <img
                  src={i.imagen || IMG_FALLBACK}
                  alt={i.nombre}
                  className="w-[62px] h-[62px] rounded-lg object-cover bg-[#E7E0D6]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = IMG_FALLBACK;
                  }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{i.nombre}</div>
                  <div className="text-xs text-[#A8876A]">{uy(i.precio)} c/u</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      className="w-6 h-6 rounded border border-[#4A3E3D] font-bold cursor-pointer"
                      onClick={() => cambiarCantidad(i.id, -1)}
                    >
                      −
                    </button>
                    <span className="min-w-[22px] text-center font-semibold">{i.cantidad}</span>
                    <button
                      className="w-6 h-6 rounded border border-[#4A3E3D] font-bold cursor-pointer"
                      onClick={() => cambiarCantidad(i.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <strong>{uy(i.precio * i.cantidad)}</strong>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-[#E7E0D6]">
          <div className="flex justify-between items-center text-xl font-bold mb-3.5">
            <span>Total</span>
            <span>{uy(totalCarrito())}</span>
          </div>
          <button
            className="w-full py-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold rounded-xl transition cursor-pointer text-center"
            onClick={() => {
              if (carrito.length === 0) return alert("Tu carrito está vacío.");
              setModalCheckout(true);
            }}
          >
            Finalizar compra por WhatsApp
          </button>
        </div>
      </aside>

      {/* MODAL CHECKOUT */}
      {modalCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[480px] overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#E7E0D6] flex justify-between items-center">
              <h3 className="text-lg font-bold">Datos de entrega</h3>
              <button className="text-2xl cursor-pointer" onClick={() => setModalCheckout(false)}>
                &times;
              </button>
            </div>
            <div className="p-5">
              <form onSubmit={enviarWhatsApp}>
                <div className="mb-4">
                  <label className="block font-semibold mb-1.5 text-sm">Nombre completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: María Pérez"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-semibold mb-1.5 text-sm">Método de entrega</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 p-3 border border-[#E7E0D6] rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="entrega"
                        value="tienda"
                        checked={entrega === "tienda"}
                        onChange={() => setEntrega("tienda")}
                      />
                      <span>Retiro en local (Ramón Trigo)</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 border border-[#E7E0D6] rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="entrega"
                        value="delivery"
                        checked={entrega === "delivery"}
                        onChange={() => setEntrega("delivery")}
                      />
                      <span>Envío a domicilio</span>
                    </label>
                  </div>
                </div>

                {entrega === "delivery" && (
                  <div className="mb-4">
                    <label className="block font-semibold mb-1.5 text-sm">Dirección</label>
                    <input
                      type="text"
                      required
                      placeholder="Calle y esquina"
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Enviar pedido a WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN DUEÑA */}
      {modalLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[400px] p-5 shadow-xl">
            <h3 className="text-lg font-bold mb-3">Acceso Panel Admin</h3>
            <form onSubmit={verificarLogin}>
              <input
                type="password"
                required
                placeholder="Contraseña de la dueña"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full p-2.5 border border-[#E7E0D6] rounded-lg mb-3"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4A3E3D] text-white font-semibold rounded-lg"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL ADMIN GLOBAL DE LA DUEÑA */}
      {modalAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Panel de Carga Global</h3>
              <button className="text-2xl cursor-pointer" onClick={() => setModalAdmin(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={guardarProducto}>
              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={pNombre}
                  onChange={(e) => setPNombre(e.target.value)}
                  className="w-full p-2 border border-[#E7E0D6] rounded-lg text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1">Precio ($UY)</label>
                <input
                  type="number"
                  required
                  value={pPrecio}
                  onChange={(e) => setPPrecio(e.target.value)}
                  className="w-full p-2 border border-[#E7E0D6] rounded-lg text-sm"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1">Categoría</label>
                <select
                  value={pCategoria}
                  onChange={(e) => setPCategoria(e.target.value)}
                  className="w-full p-2 border border-[#E7E0D6] rounded-lg text-sm"
                >
                  <option value="Bazar">Bazar</option>
                  <option value="Ropa de Dama">Ropa de Dama</option>
                  <option value="Alimentos">Alimentos</option>
                  <option value="Lácteos y Bebidas">Lácteos y Bebidas</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Ofertas">Ofertas</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1">Subir Foto desde Celular</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={previsualizarFoto}
                  className="w-full p-2 border border-[#E7E0D6] rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4A3E3D] hover:bg-[#2C2623] text-white font-semibold rounded-xl"
              >
                Publicar para todos los clientes
              </button>
            </form>

            <hr className="my-5" />

            <h4 className="font-bold mb-3 text-sm">Eliminar o marcar agotado</h4>
            <div className="space-y-3">
              {productos.map((prod) => (
                <div key={prod.id} className="flex gap-3 items-center py-2 border-b">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate">{prod.nombre}</div>
                    <div className="text-[0.7rem] text-[#A8876A]">{uy(prod.precio)}</div>
                  </div>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={estaAgotado(prod.id)}
                      onChange={() => toggleStock(prod.id)}
                    />
                    Agotado
                  </label>
                  <button
                    className="text-red-700 font-bold p-1 cursor-pointer"
                    onClick={() => eliminarProductoAdmin(prod.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
