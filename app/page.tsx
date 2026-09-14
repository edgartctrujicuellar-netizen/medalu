"use client";

import { useState, useEffect, ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";

// Tipos de datos
interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  imagen: string;
  agotado: boolean;
  comentarios?: string;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

const WHATSAPP_NUMERO = "59892828243";
const CATEGORIAS = ["Todos","Bazar", "Ropa de Dama", "Alimentos", "Ropa de niño", "Limpieza", "Ofertas"];

const KEY_CARRITO = "medalu_carrito";

const IMG_FALLBACK = "https://placehold.co/500x500/E7E0D6/4A3E3D?text=Medalu";

export default function Home() {
  // Estados de la tienda
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Estados de Modales y Vistas
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [modalCheckout, setModalCheckout] = useState(false);
  const [modalLogin, setModalLogin] = useState(false);
  const [modalAdmin, setModalAdmin] = useState(false);
  const [vistaRecuperar, setVistaRecuperar] = useState(false);

  // Formulario Checkout
  const [clienteNombre, setClienteNombre] = useState("");
  const [entrega, setEntrega] = useState("tienda");
  const [clienteDireccion, setClienteDireccion] = useState("");

  // Formulario Login / Pass
  const [loginPass, setLoginPass] = useState("");
  const [capsLogin, setCapsLogin] = useState(false);
  const [recSeguridad, setRecSeguridad] = useState("");
  const [recMaestra, setRecMaestra] = useState("");
  const [recNueva, setRecNueva] = useState("");
  const [capsRec, setCapsRec] = useState(false);

  // Sesión de admin: guardamos la contraseña validada en memoria
  // (no en localStorage) para poder autorizar las siguientes
  // acciones de administración sin pedirla en cada clic.
  const [adminPass, setAdminPass] = useState("");

  // Formulario Admin
  const [pNombre, setPNombre] = useState("");
  const [pPrecio, setPPrecio] = useState("");
  const [pCategoria, setPCategoria] = useState("Ropa de Dama");
  const [pImagen, setPImagen] = useState("");
  const [previewFoto, setPreviewFoto] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cargar carrito (local) y productos (Supabase) al iniciar
  useEffect(() => {
    try {
      const c = localStorage.getItem(KEY_CARRITO);
      if (c) setCarrito(JSON.parse(c));
    } catch (err) {
      console.error(err);
    }
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setCargandoProductos(true);
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, categoria, imagen, agotado")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error cargando productos:", error);
    } else if (data) {
      setProductos(data as Producto[]);
    }
    setCargandoProductos(false);
  };

  // Utilidades
  const uy = (n: number) => "$UY " + Math.round(Number(n));

  const todosLosProductos = () => productos;

  const estaAgotado = (id: string) => {
    const p = productos.find(prod => prod.id === id);
    return p?.agotado ?? false;
  };

  // Funciones del Carrito
  const guardarCarritoState = (nuevoCarrito: ItemCarrito[]) => {
    setCarrito(nuevoCarrito);
    localStorage.setItem(KEY_CARRITO, JSON.stringify(nuevoCarrito));
  };

  const agregarAlCarrito = (id: string) => {
    if (estaAgotado(id)) return;
    const prod = todosLosProductos().find(p => p.id === id);
    if (!prod) return;

    const existente = carrito.find(i => i.id === id);
    let nuevo: ItemCarrito[];
    if (existente) {
      nuevo = carrito.map(i => i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i);
    } else {
      nuevo = [...carrito, { ...prod, cantidad: 1 }];
    }
    guardarCarritoState(nuevo);
    setDrawerAbierto(true);
  };

  const cambiarCantidad = (id: string, delta: number) => {
    const nuevo = carrito.map(item => {
      if (item.id === id) {
        return { ...item, cantidad: item.cantidad + delta };
      }
      return item;
    }).filter(item => item.cantidad > 0);
    guardarCarritoState(nuevo);
  };

  const quitarDelCarrito = (id: string) => {
    const nuevo = carrito.filter(i => i.id !== id);
    guardarCarritoState(nuevo);
  };

  const totalCarrito = () => carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalItemsCount = () => carrito.reduce((s, i) => s + i.cantidad, 0);

  // Lógica del Checkout WhatsApp
  const enviarWhatsApp = (e: FormEvent) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    let msj = `*NUEVO PEDIDO - MEDALU*\n`;
    msj += `*Cliente:* ${clienteNombre}\n`;
    msj += `*Método:* ${entrega === "delivery" ? "Envío a domicilio" : "Retiro en local"}\n`;
    if (entrega === "delivery") {
      msj += `*Dirección:* ${clienteDireccion}\n`;
    }
    msj += `--------------------------\n`;
    carrito.forEach(i => {
      msj += `• ${i.nombre} x${i.cantidad} = ${uy(i.precio * i.cantidad)}\n`;
    });
    msj += `--------------------------\n`;
    msj += `*TOTAL:* ${uy(totalCarrito())}`;

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msj)}`;
    window.open(url, "_blank");

    // Resetear carrito y modal
    guardarCarritoState([]);
    setModalCheckout(false);
    setClienteNombre("");
    setClienteDireccion("");
  };

  // Lógica de Admin y Login
  const chequearCaps = (e: KeyboardEvent<HTMLInputElement>, setCaps: (b: boolean) => void) => {
    setCaps(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const verificarLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPass }),
      });
      if (res.ok) {
        setAdminPass(loginPass);
        setModalLogin(false);
        setModalAdmin(true);
        setLoginPass("");
      } else {
        alert("Contraseña incorrecta.");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo verificar la contraseña. Intenta de nuevo.");
    }
  };

  const recuperarPass = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuesta: recSeguridad,
          claveMaestra: recMaestra,
          nuevaPass: recNueva,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("¡Contraseña restablecida correctamente! Ahora ingresa con tu nueva contraseña.");
        setVistaRecuperar(false);
        setRecSeguridad("");
        setRecMaestra("");
        setRecNueva("");
      } else {
        alert(data.error || "No se pudo restablecer la contraseña.");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo restablecer la contraseña. Intenta de nuevo.");
    }
  };

  // Foto preview en Admin
  const previsualizarFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewFoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarProducto = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const imgFinal = previewFoto || pImagen || IMG_FALLBACK;

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPass,
        },
        body: JSON.stringify({
          nombre: pNombre.trim(),
          precio: Number(pPrecio),
          categoria: pCategoria,
          imagen: imgFinal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.producto) {
        setProductos(prev => [...prev, data.producto as Producto]);
        setPNombre("");
        setPPrecio("");
        setPCategoria("Ropa de Dama");
        setPImagen("");
        setPreviewFoto("");
      } else {
        alert(data.error || "No se pudo guardar el producto.");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el producto. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const toggleStock = async (id: string) => {
    const nuevoValor = !estaAgotado(id);
    // Actualizamos en pantalla al toque, y si falla, revertimos.
    setProductos(prev => prev.map(p => p.id === id ? { ...p, agotado: nuevoValor } : p));

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPass,
        },
        body: JSON.stringify({ id, agotado: nuevoValor }),
      });
      if (!res.ok) {
        setProductos(prev => prev.map(p => p.id === id ? { ...p, agotado: !nuevoValor } : p));
        alert("No se pudo actualizar el stock.");
      }
    } catch (err) {
      console.error(err);
      setProductos(prev => prev.map(p => p.id === id ? { ...p, agotado: !nuevoValor } : p));
      alert("No se pudo actualizar el stock.");
    }
  };

  const eliminarProductoAdmin = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

    const anterior = productos;
    setProductos(prev => prev.filter(p => p.id !== id));

    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPass,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setProductos(anterior);
        alert("No se pudo eliminar el producto.");
      }
    } catch (err) {
      console.error(err);
      setProductos(anterior);
      alert("No se pudo eliminar el producto.");
    }
  };

  // Filtrado de productos visibles
  const productosFiltrados = todosLosProductos().filter(p =>
    categoriaActiva === "Todos" ? true : p.categoria === categoriaActiva
  );

  return (
    <div className="min-h-screen bg-[#F3EFEA] text-[#4A3E3D] font-sans">
      {/* Estilos embebidos idénticos al original */}
      <style jsx global>{`
        :root {
          --crema: #F3EFEA;
          --crema-oscuro: #E7E0D6;
          --marron: #4A3E3D;
          --cafe: #2C2623;
          --cafe-hover: #413832;
          --blanco: #FFFFFF;
          --acento: #A8876A;
          --plomo: #9A938C;
          --sombra: 0 6px 24px rgba(44, 38, 35, 0.10);
          --radio: 14px;
        }

        /* Botones */
        .btn {
          font: inherit;
          border: none;
          cursor: pointer;
          border-radius: 999px;
          padding: 10px 20px;
          font-weight: 600;
          transition: background-color .2s ease, transform .1s ease, color .2s ease;
        }
        .btn:active { transform: scale(.97); }
        .btn-cafe { background-color: var(--cafe); color: var(--crema); }
        .btn-cafe:hover { background-color: var(--cafe-hover); }
        .btn-agotado { background-color: var(--plomo); color: var(--crema); cursor: not-allowed; opacity: .9; }
        .btn-wsp { background-color: #1EBE5D; color: #fff; width: 100%; padding: 14px; font-size: 1rem; }
        .btn-wsp:hover { background-color: #17a350; }

        /* Tarjetas de Producto */
        .card {
          background: var(--blanco);
          border-radius: var(--radio);
          overflow: hidden;
          box-shadow: var(--sombra);
          display: flex;
          flex-direction: column;
          transition: transform .2s ease;
          position: relative;
        }
        .card:hover { transform: translateY(-4px); }
        .card .thumb { aspect-ratio: 1 / 1; background: var(--crema-oscuro); overflow: hidden; }
        .card .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .badge-agotado {
          position: absolute; top: 10px; left: 10px;
          background: var(--plomo); color: var(--crema);
          font-size: .7rem; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; padding: 4px 10px; border-radius: 999px;
        }
        .card.sin-stock .thumb img { filter: grayscale(.7) opacity(.7); }

        /* Chips Filtro */
        .chip {
          background: transparent;
          border: 1px solid var(--crema-oscuro);
          color: var(--marron);
          border-radius: 999px;
          padding: 8px 18px;
          cursor: pointer;
          font: inherit;
          font-weight: 600;
          transition: all .2s ease;
        }
        .chip:hover { border-color: var(--acento); }
        .chip.activo { background: var(--marron); color: var(--crema); border-color: var(--marron); }

        /* Overlay y Drawer */
        .overlay {
          position: fixed; inset: 0; background: rgba(44, 38, 35, .45);
          opacity: 0; visibility: hidden; transition: opacity .25s ease; z-index: 60;
        }
        .overlay.abierto { opacity: 1; visibility: visible; }
        .drawer {
          position: fixed; top: 0; right: 0; height: 100%; width: min(420px, 92vw);
          background: var(--crema); z-index: 70; transform: translateX(100%);
          transition: transform .3s ease; display: flex; flex-direction: column;
          box-shadow: -8px 0 30px rgba(0,0,0,.15);
        }
        .drawer.abierto { transform: translateX(0); }

        /* Modales */
        .modal {
          position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
          background: rgba(44,38,35,.5); z-index: 80; padding: 16px;
        }
        .modal.abierto { display: flex; }
        .modal-card {
          background: var(--crema); border-radius: var(--radio); width: min(480px, 100%);
          max-height: 92vh; overflow-y: auto; box-shadow: var(--sombra);
        }
      `}</style>

      {/* ENCABEZADO */}
      <header className="bg-[#F3EFEA] border-b border-[#E7E0D6] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.35em] text-[#4A3E3D] leading-none">
              MEDALU
            </h1>
            <p className="text-xs tracking-[0.3em] uppercase text-[#A8876A] mt-1">
              Tu tienda local
            </p>
          </div>
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
            <button className="btn btn-cafe relative" onClick={() => setDrawerAbierto(true)}>
              Carrito
              <span className="absolute -top-1.5 -right-1.5 bg-[#A8876A] text-white text-[0.72rem] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                {totalItemsCount()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1200px] mx-auto pt-10 pb-2 px-5 text-center">
        <h2 className="text-xl sm:text-3xl font-bold mb-2">Tus productos al mejor precio</h2>
        <p className="text-[#A8876A] max-w-[560px] mx-auto">
          Ropa de dama, alimentos y productos para el hogar al mejor precio.
        </p>
      </section>

      {/* FILTROS DE CATEGORÍA */}
      <nav className="max-w-[1200px] mx-auto py-6 px-5 flex gap-2.5 flex-wrap justify-center">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            className={`chip ${cat === categoriaActiva ? "activo" : ""}`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* CATÁLOGO */}
      <main className="max-w-[1200px] mx-auto px-5 py-5">
        {cargandoProductos ? (
          <p className="col-span-full text-center py-16 text-[#A8876A]">
            Cargando productos...
          </p>
        ) : productosFiltrados.length === 0 ? (
          <p className="col-span-full text-center py-16 text-[#A8876A]">
            No hay productos en esta categoría todavía.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
            {productosFiltrados.map(p => {
              const agotado = estaAgotado(p.id);
              const imagen = p.imagen && p.imagen.trim() !== "" ? p.imagen : IMG_FALLBACK;

              return (
                <article key={p.id} className={`card ${agotado ? "sin-stock" : ""}`}>
                  {agotado && <span className="badge-agotado">Agotado</span>}
                  <div className="thumb">
                    <img
                      src={imagen}
                      alt={p.nombre}
                      onError={(e) => { (e.target as HTMLImageElement).src = IMG_FALLBACK; }}
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-1.5 flex-1">
                    <span className="text-[0.7rem] tracking-[0.15em] uppercase text-[#A8876A] font-bold">
                      {p.categoria}
                    </span>
                    <span className="font-semibold text-[#4A3E3D]">{p.nombre}</span>
                    <span className="text-lg font-bold text-[#2C2623] mt-auto">
                      {uy(p.precio)}
                    </span>

                    {agotado ? (
                      <button className="btn btn-agotado mt-2" disabled>Agotado</button>
                    ) : (
                      <button className="btn btn-cafe mt-2" onClick={() => agregarAlCarrito(p.id)}>
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

      {/* PIE DE PÁGINA */}
      <footer className="text-center py-10 px-5 text-[#A8876A] text-sm">
        <div className="max-w-[640px] mx-auto mb-6 p-6 bg-white rounded-2xl shadow-[0_6px_22px_rgba(74,62,61,0.07)]">
          <h4 className="text-lg text-[#4A3E3D] font-bold mb-3 tracking-wide">
            Contacto y ubicación
          </h4>
          <ul className="list-none space-y-2 text-[#4A3E3D] text-sm">
            <li>Ramón Trigo, Cerro Largo, Uruguay</li>
            <li>
              WhatsApp:{" "}
              <a href="https://wa.me/59892828243" target="_blank" rel="noopener noreferrer" className="hover:underline">
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
          <button className="underline cursor-pointer bg-none border-none text-[#A8876A]" onClick={() => setModalLogin(true)}>
            Ingresa al Panel de Administración
          </button>
        </p>
      </footer>

      {/* CARRITO (DRAWER) */}
      <div
        className={`overlay ${drawerAbierto ? "abierto" : ""}`}
        onClick={() => setDrawerAbierto(false)}
      />
      <aside className={`drawer ${drawerAbierto ? "abierto" : ""}`}>
        <div className="p-5 border-b border-[#E7E0D6] flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-wider">Tu Carrito</h3>
          <button className="text-2xl cursor-pointer" onClick={() => setDrawerAbierto(false)}>&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {carrito.length === 0 ? (
            <p className="text-center py-[60px] text-[#A8876A]">Tu carrito está vacío.</p>
          ) : (
            carrito.map(i => (
              <div key={i.id} className="flex gap-3 items-center py-3 border-b border-[#E7E0D6]">
                <img
                  src={i.imagen || IMG_FALLBACK}
                  alt={i.nombre}
                  className="w-[62px] h-[62px] rounded-lg object-cover bg-[#E7E0D6]"
                  onError={(e) => { (e.target as HTMLImageElement).src = IMG_FALLBACK; }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{i.nombre}</div>
                  <div className="text-xs text-[#A8876A]">{uy(i.precio)} c/u</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      className="w-6 h-6 rounded border border-[#4A3E3D] font-bold leading-none"
                      onClick={() => cambiarCantidad(i.id, -1)}
                    >
                      −
                    </button>
                    <span className="min-w-[22px] text-center font-semibold">{i.cantidad}</span>
                    <button
                      className="w-6 h-6 rounded border border-[#4A3E3D] font-bold leading-none"
                      onClick={() => cambiarCantidad(i.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-xs text-[#b23c3c] underline mt-1 block cursor-pointer"
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
            className="btn btn-wsp"
            onClick={() => {
              if (carrito.length === 0) { alert("Tu carrito está vacío."); return; }
              setModalCheckout(true);
            }}
          >
            Finalizar compra por WhatsApp
          </button>
        </div>
      </aside>

      {/* MODAL CHECKOUT */}
      <div className={`modal ${modalCheckout ? "abierto" : ""}`}>
        <div className="modal-card">
          <div className="p-5 border-b border-[#E7E0D6] flex justify-between items-center">
            <h3 className="text-lg font-bold">Datos de entrega</h3>
            <button className="text-2xl cursor-pointer" onClick={() => setModalCheckout(false)}>&times;</button>
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
                    <span>Retiro en local <strong>(Gratis · Ramón Trigo)</strong></span>
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

              <button type="submit" className="btn btn-wsp">Enviar pedido a WhatsApp</button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL LOGIN ADMIN */}
      <div className={`modal ${modalLogin ? "abierto" : ""}`}>
        <div className="modal-card">
          <div className="p-5 border-b border-[#E7E0D6] flex justify-between items-center">
            <h3 className="text-lg font-bold">Acceso de la dueña</h3>
            <button className="text-2xl cursor-pointer" onClick={() => setModalLogin(false)}>&times;</button>
          </div>
          <div className="p-5">
            {!vistaRecuperar ? (
              <form onSubmit={verificarLogin}>
                <p className="bg-[#E7E0D6] p-3 rounded-lg text-xs mb-4">Ingresa tu contraseña para administrar la tienda.</p>
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
                  {capsLogin && <p className="text-xs font-semibold text-amber-700 mt-1">⚠ Bloq Mayús / Caps Lock está activado</p>}
                </div>
                <button type="submit" className="btn btn-cafe w-full py-3">Ingresar</button>
                <p className="mt-3.5 text-center">
                  <button type="button" className="underline text-xs text-[#A8876A]" onClick={() => setVistaRecuperar(true)}>
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
                  <label className="block font-semibold mb-1 text-xs">¿Cuál es el nombre de tu tienda?</label>
                  <input
                    type="text"
                    placeholder="Respuesta de seguridad"
                    value={recSeguridad}
                    onChange={(e) => setRecSeguridad(e.target.value)}
                    className="w-full p-2.5 border border-[#E7E0D6] rounded-lg bg-white text-sm"
                  />
                </div>
                <div className="mb-3">
                  <label className="block font-semibold mb-1 text-xs">Clave maestra de recuperación</label>
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
                  {capsRec && <p className="text-xs font-semibold text-amber-700 mt-1">⚠ Bloq Mayús / Caps Lock está activado</p>}
                </div>
                <button type="submit" className="btn btn-cafe w-full py-3">Restablecer contraseña</button>
                <p className="mt-3.5 text-center">
                  <button type="button" className="underline text-xs text-[#A8876A]" onClick={() => setVistaRecuperar(false)}>
                    Volver al inicio de sesión
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PANEL ADMIN */}
      <div className={`modal ${modalAdmin ? "abierto" : ""}`}>
        <div className="modal-card">
          <div className="p-5 border-b border-[#E7E0D6] flex justify-between items-center">
            <h3 className="text-lg font-bold">Panel de Administración Medalu</h3>
            <button className="text-2xl cursor-pointer" onClick={() => setModalAdmin(false)}>&times;</button>
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
                  <option value="Lácteos y Bebidas">Ropa de niño</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Ofertas">Ofertas</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block font-semibold mb-1 text-xs">Subir foto desde dispositivo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={previsualizarFoto}
                  className="w-full p-2 border border-[#E7E0D6] rounded-lg bg-white text-xs"
                />
                {previewFoto && (
                  <img src={previewFoto} alt="Preview" className="mt-2 w-full max-h-[180px] object-cover rounded-lg border" />
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
              <button type="submit" className="btn btn-cafe w-full py-3" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Producto"}
              </button>
            </form>

            <hr className="my-5 border-t border-[#E7E0D6]" />
            <h4 className="font-bold mb-3 text-sm">Gestión del catálogo</h4>

            <div className="space-y-3">
              {todosLosProductos().map(prod => {
                const agotado = estaAgotado(prod.id);
                return (
                  <div key={prod.id} className="flex gap-3 items-center py-2 border-b border-[#E7E0D6]">
                    <img
                      src={prod.imagen || IMG_FALLBACK}
                      alt={prod.nombre}
                      className="w-12 h-12 rounded-lg object-cover bg-[#E7E0D6]"
                      onError={(e) => { (e.target as HTMLImageElement).src = IMG_FALLBACK; }}
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
                      className="text-red-700 font-bold p-1 hover:bg-red-50 rounded"
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
    </div>
  );
}
