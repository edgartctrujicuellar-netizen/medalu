"use client";

import React, { useState, useEffect } from "react";

// Tipos de datos
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
  "Ropa de Dama",
  "Bazar",
  "Alimentos",
  "Lácteos y Bebidas",
  "Limpieza",
  "Ofertas",
];

const PRODUCTOS_INICIALES: Producto[] = [
  {
    id: "p1",
    nombre: "Yerba Mate 1kg",
    precio: 180,
    categoria: "Alimentos",
    imagen: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80",
  },
  {
    id: "p2",
    nombre: "Leche Entera 1L",
    precio: 45,
    categoria: "Lácteos y Bebidas",
    imagen: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
  },
  {
    id: "p3",
    nombre: "Juego de Tazas de Cerámica",
    precio: 350,
    categoria: "Bazar",
    imagen: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
  },
];

const IMG_FALLBACK = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80";

export default function PaginaMedaluStore() {
  // Estados de catálogo y productos
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  const [agotados, setAgotados] = useState<string[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos");

  // Estados del Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [drawerAbierto, setDrawerAbierto] = useState<boolean>(false);

  // Estados de Modales y Autenticación
  const [modalCheckout, setModalCheckout] = useState<boolean>(false);
  const [modalLogin, setModalLogin] = useState<boolean>(false);
  const [modalAdmin, setModalAdmin] = useState<boolean>(false);

  // Formulario Checkout
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [clienteDireccion, setClienteDireccion] = useState<string>("");
  const [entrega, setEntrega] = useState<"tienda" | "delivery">("tienda");

  // Formulario Admin
  const [loginPass, setLoginPass] = useState<string>("");
  const [passGuardada, setPassGuardada] = useState<string>("Medalu2026");
  const [capsLogin, setCapsLogin] = useState<boolean>(false);
  const [vistaRecuperar, setVistaRecuperar] = useState<boolean>(false);
  const [recSeguridad, setRecSeguridad] = useState<string>("");
  const [recMaestra, setRecMaestra] = useState<string>("");
  const [recNueva, setRecNueva] = useState<string>("");
  const [capsRec, setCapsRec] = useState<boolean>(false);

  // Formulario Agregar Producto
  const [pNombre, setPNombre] = useState<string>("");
  const [pPrecio, setPPrecio] = useState<string>("");
  const [pCategoria, setPCategoria] = useState<string>("Bazar");
  const [pImagen, setPImagen] = useState<string>("");
  const [previewFoto, setPreviewFoto] = useState<string>("");

  // Carga inicial y persistencia local + global
  useEffect(() => {
    const pGuardados = localStorage.getItem("medalu_productos_v2");
    if (pGuardados) {
      try {
        setProductos(JSON.parse(pGuardados));
      } catch (e) {
        console.error("Error al cargar productos guardados", e);
      }
    }
    const aGuardados = localStorage.getItem("medalu_agotados");
    if (aGuardados) {
      try {
        setAgotados(JSON.parse(aGuardados));
      } catch (e) {
        console.error("Error al cargar productos agotados", e);
      }
    }
    const passLocal = localStorage.getItem("medalu_pass");
    if (passLocal) setPassGuardada(passLocal);
  }, []);

  // Formateador de moneda Uruguaya
  const uy = (monto: number) => `$UY ${monto.toLocaleString("es-UY")}`;

  // Lógica de Stock
  const estaAgotado = (id: string) => agotados.includes(id);

  const toggleStock = (id: string) => {
    const nuevosAgotados = estaAgotado(id)
      ? agotados.filter((aId) => aId !== id)
      : [...agotados, id];
    setAgotados(nuevosAgotados);
    localStorage.setItem("medalu_agotados", JSON.stringify(nuevosAgotados));
  };

  // Carrito Lógica
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

  // Enviar pedido por WhatsApp
  const enviarWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    let msg = `*Nuevo pedido en MEDALU STORE*\n\n`;
    msg += `*Cliente:* ${clienteNombre}\n`;
    msg += `*Método:* ${entrega === "tienda" ? "Retiro en Local (Ramón Trigo)" : "Envío a domicilio"}\n`;
    if (entrega === "delivery") {
      msg += `*Dirección:* ${clienteDireccion}\n`;
    }
    msg += `\n*Detalle del pedido:*\n`;

    carrito.forEach((i) => {
      msg += `• ${i.nombre} x${i.cantidad} - ${uy(i.precio * i.cantidad)}\n`;
    });

    msg += `\n*TOTAL: ${uy(totalCarrito())}*`;

    const url = `https://wa.me/59892828243?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Login y Recuperación
  const chequearCaps = (e: React.KeyboardEvent, setter: (val: boolean) => void) => {
    if (e.getModifierState("CapsLock")) {
      setter(true);
    } else {
      setter(false);
    }
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

  const recuperarPass = (e: React.FormEvent) => {
    e.preventDefault();
    const respSegOk = recSeguridad.trim().toLowerCase() === "medalu";
    const claveMaestraOk = recMaestra.trim() === "MEDALU1234";

    if (respSegOk || claveMaestraOk) {
      setPassGuardada(recNueva);
      localStorage.setItem("medalu_pass", recNueva);
      alert("¡Contraseña restablecida con éxito! Ya puedes ingresar.");
      setVistaRecuperar(false);
      setRecSeguridad("");
      setRecMaestra("");
      setRecNueva("");
    } else {
      alert("La respuesta de seguridad o la clave maestra son incorrectas.");
    }
  };

  // Previsualización de Imagen
  const previsualizarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar Producto en Panel Admin
  const guardarProducto = (e: React.FormEvent) => {
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
    localStorage.setItem("medalu_productos_v2", JSON.stringify(listaActualizada));

    // Limpiar formulario
    setPNombre("");
    setPPrecio("");
    setPCategoria("Bazar");
    setPImagen("");
    setPreviewFoto("");
    alert("¡Producto agregado con éxito!");
  };

  const eliminarProductoAdmin = (id: string) => {
    if (confirm("¿Estás segura de eliminar este producto del catálogo?")) {
      const listaActualizada = productos.filter((p) => p.id !== id);
      setProductos(listaActualizada);
      localStorage.setItem("medalu_productos_v2", JSON.stringify(listaActualizada));
    }
  };

  // Filtro de productos
  const productosFiltrados =
    categoriaActiva === "Todos"
      ? productos
      : productos.filter((p) => p.categoria === categoriaActiva);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3E3D]">
      {/* ENCABEZADO Y LOGO */}
      <header className="bg-[#F3EFEA] border-b border-[#E7E0D6] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Si tienes la imagen del logo cargada en public/logo.png se mostrará aquí */}
            <img
              src="/logo.png"
              alt="Medalu Logo"
              className="h-12 w-auto object-contain hidden sm:block"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.35em] text-[#4A3E3D] leading-none">
                MEDALU
              </h1>
              <p className="text-xs tracking-[0.3em] uppercase text-[#A8876A] mt-1">
                Tu tienda local
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
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
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="max-w-[1200px] mx-auto pt-10 pb-2 px-5 text-center">
        <h2 className="text-xl sm:text-3xl font-bold mb-2">Tus productos al mejor precio</h2>
        <p className="text-[#A8876A] max-w-[560px] mx-auto">
          Ropa de dama, artículos de bazar, alimentos y productos para el hogar.
        </p>
      </section>

      {/* FILTROS DE CATEGORÍA (INCLUYE BAZAR) */}
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

      {/* CATÁLOGO DE PRODUCTOS */}
      <main className="max-w-[1200px] mx-auto px-5 py-5">
        {productosFiltrados.length === 0 ? (
          <p className="col-span-full text-center py-16 text-[#A8876A]">
            No hay productos en esta categoría todavía.
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

      {/* PIE DE PÁGINA Y CONTACTO */}
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
            <li>
              <a href="mailto:blancarodales16@gmail.com" className="hover:underline">
                blancarodales16@gmail.com
              </a>
            </li>
          </ul>
          <a
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#2C2623] text-white rounded-full font-semibold text-sm hover:opacity-90"
            href="https://www.google.com/maps?q=-32.349611,-54.637167"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar (Ver en Google Maps)
          </a>
        </div>
        <p>© {new Date().getFullYear()} Medalu · Tu tienda local.</p>
        <p className="mt-2">
          ¿Eres la dueña?{" "}
          <button
            className="underline cursor-pointer bg-none border-none text-[#A8876A] font-semibold"
            onClick={() => setModalLogin(true)}
          >
            Ingresa al Panel de Administración
          </button>
        </p>
      </footer>

      {/* DRAWER DEL CARRITO */}
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
                      className="w-6 h-6 rounded border border-[#4A3E3D] font-bold leading-none cursor-pointer"
                      onClick={() => cambiarCantidad(i.id, -1)}
                    >
                      −
                    </button>
                    <span className="min-w-[22px] text-center font-semibold">{i.cantidad}</span>
                    <button
                      className="w-6 h-6 rounded border border-[#4A3E3D] font-bold leading-none cursor-pointer"
                      onClick={() => cambiarCantidad(i.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-xs text-red-600 underline mt-1 block cursor-pointer"
                    onClick={() => quitarDelCarrito(i.id)}
                  >
                    Quitar
                  </button>
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
              if (carrito.length === 0) {
                alert("Tu carrito está vacío.");
                return;
              }
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
                    <label className="flex items-center gap-2.5 p-3 border border-[#E7E0D6] rounded-lg cursor-pointer bg-white">
                      <input
                        type="radio"
                        name="entrega"
                        value="tienda"
                        checked={entrega === "tienda"}
                        onChange={() => setEntrega("tienda")}
                      />
                      <span>
                        Retiro en local <strong>(Gratis · Ramón Trigo)</strong>
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 border border-[#E7E0D6] rounded-lg cursor-pointer bg-white">
                      <input
                        type="radio"
                        name="entrega"
                        value="delivery"
                        checked={entrega === "delivery"}
                        onChange={() => setEntrega("delivery")}
                      />
                      <span>Envíos</span>
                    </label>
                  </div>
                </div>

                {entrega === "delivery" && (
                  <div className="mb-4">
                    <label className="block font-semibold mb-1.5 text-sm">Dirección de entrega</label>
                    <input
                      type="text"
                      required={entrega === "delivery"}
                      placeholder="Calle, número, barrio, referencia"
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

      {/* MODAL LOGIN ADMIN */}
      {modalLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#E7E0D6] flex justify-between items-center">
              <h3 className="text-lg font-bold">Acceso de la dueña</h3>
              <button className="text-2xl cursor-pointer" onClick={() => setModalLogin(false)}>
                &times;
              </button>
            </div>
            <div className="p-5">
              {!vistaRecuperar ? (
                <form onSubmit={verificarLogin}>
                  <p className="bg-[#E7E0D6] p-3 rounded-lg text-xs mb-4">
                    Ingresa tu contraseña para administrar la tienda.
                  </p>
                  <div className="mb-4">
                    <label className="block font-semibold mb-1.5 text-sm">Contraseña</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      onKeyUp={(e) => chequearCaps(e, setCapsLogin)}
                      onKeyDown={(e) => chequearCaps(e, setCapsLogin)}
                      className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white"
                    />
                    {capsLogin && (
                      <p className="text-xs font-semibold text-amber-700 mt-1">
                        ⚠ Bloq Mayús / Caps Lock está activado
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#4A3E3D] hover:bg-[#2C2623] text-white font-semibold rounded-xl transition cursor-pointer"
                  >
                    Ingresar
                  </button>
                  <p className="mt-3.5 text-center">
                    <button
                      type="button"
                      className="underline text-xs text-[#A8876A] cursor-pointer"
                      onClick={() => setVistaRecuperar(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={recuperarPass}>
                  <p className="bg-[#E7E0D6] p-3 rounded-lg text-xs mb-4">
                    Responde la pregunta de seguridad <strong>o</strong> ingresa la clave maestra.
                  </p>
                  <div className="mb-3">
                    <label className="block font-semibold mb-1 text-xs">
                      ¿Cuál es el nombre de tu tienda?
                    </label>
                    <input
                      type="text"
                      placeholder="Respuesta de seguridad"
                      value={recSeguridad}
                      onChange={(e) => setRecSeguridad(e.target.value)}
                      className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block font-semibold mb-1 text-xs">
                      Clave maestra de recuperación
                    </label>
                    <input
                      type="text"
                      placeholder="Opcional si respondiste arriba"
                      value={recMaestra}
                      onChange={(e) => setRecMaestra(e.target.value)}
                      className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block font-semibold mb-1 text-xs">Nueva contraseña</label>
                    <input
                      type="password"
                      required
                      placeholder="Escribe tu nueva contraseña"
                      value={recNueva}
                      onChange={(e) => setRecNueva(e.target.value)}
                      onKeyUp={(e) => chequearCaps(e, setCapsRec)}
                      onKeyDown={(e) => chequearCaps(e, setCapsRec)}
                      className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                    />
                    {capsRec && (
                      <p className="text-xs font-semibold text-amber-700 mt-1">
                        ⚠ Bloq Mayús / Caps Lock está activado
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#4A3E3D] hover:bg-[#2C2623] text-white font-semibold rounded-xl transition cursor-pointer"
                  >
                    Restablecer contraseña
                  </button>
                  <p className="mt-3.5 text-center">
                    <button
                      type="button"
                      className="underline text-xs text-[#A8876A] cursor-pointer"
                      onClick={() => setVistaRecuperar(false)}
                    >
                      Volver al inicio de sesión
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PANEL ADMIN */}
      {modalAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-[#E7E0D6] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold">Panel de Administración Medalu</h3>
              <button className="text-2xl cursor-pointer" onClick={() => setModalAdmin(false)}>
                &times;
              </button>
            </div>
            <div className="p-5">
              <p className="bg-[#E7E0D6] p-3 rounded-lg text-xs mb-4">
                Agrega productos, marca los que están <strong>agotados</strong> o elimínalos.
              </p>

              <form onSubmit={guardarProducto}>
                <div className="mb-3">
                  <label className="block font-semibold mb-1 text-xs">Nombre del producto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Yerba Mate 1kg"
                    value={pNombre}
                    onChange={(e) => setPNombre(e.target.value)}
                    className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                  />
                </div>
                <div className="mb-3">
                  <label className="block font-semibold mb-1 text-xs">Precio ($UY)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="Ej: 150"
                    value={pPrecio}
                    onChange={(e) => setPPrecio(e.target.value)}
                    className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                  />
                </div>
                <div className="mb-3">
                  <label className="block font-semibold mb-1 text-xs">Categoría</label>
                  <select
                    value={pCategoria}
                    onChange={(e) => setPCategoria(e.target.value)}
                    className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
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
                  <label className="block font-semibold mb-1 text-xs">
                    Subir foto desde dispositivo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={previsualizarFoto}
                    className="w-full p-2 border border-[#E7E0D6] rounded-lg bg-white text-xs"
                  />
                  {previewFoto && (
                    <img
                      src={previewFoto}
                      alt="Preview"
                      className="mt-2 w-full max-h-[180px] object-cover rounded-lg border"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-xs">O usar URL de imagen</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={pImagen}
                    onChange={(e) => setPImagen(e.target.value)}
                    className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#4A3E3D] hover:bg-[#2C2623] text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Guardar Producto
                </button>
              </form>

              <hr className="my-5 border-t border-[#E7E0D6]" />
              <h4 className="font-bold mb-3 text-sm">Gestión del catálogo</h4>

              <div className="space-y-3">
                {productos.map((prod) => {
                  const agotado = estaAgotado(prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="flex gap-3 items-center py-2 border-b border-[#E7E0D6]"
                    >
                      <img
                        src={prod.imagen || IMG_FALLBACK}
                        alt={prod.nombre}
                        className="w-12 h-12 rounded-lg object-cover bg-[#E7E0D6]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = IMG_FALLBACK;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate">{prod.nombre}</div>
                        <div className="text-[0.7rem] text-[#A8876A]">{uy(prod.precio)}</div>
                      </div>
                      <label className="flex items-center gap-1.5 text-[0.78rem] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agotado}
                          onChange={() => toggleStock(prod.id)}
                        />
                        Agotado
                      </label>
                      <button
                        className="text-red-700 font-bold p-1 hover:bg-red-50 rounded cursor-pointer"
                        onClick={() => eliminarProductoAdmin(prod.id)}
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
