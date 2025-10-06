import Image from "next/image";
import Link from "next/link";

export default function ConocenosPage() {
  const staffMembers = [
    {
      id: 1,
      name: "Jorge Fermín Villanueva",
      position: "Fundador & CEO",
      description:
        "Con más de 40 años de experiencia en el sector, Jorge lidera nuestro equipo con pasión y dedicación.",
      image: "/staff/jorge.png",
      email: "ventasfernar4020@gmail.com",
    },
    {
      id: 2,
      name: "Alonso Alarcon Aguilar",
      position: "Marketing y Programación",
      description:
        "Alonso se encarga de que todo funcione perfectamente, asegurando la mejor experiencia para nuestros clientes.",
      image: "/staff/alonso1.png",
      email: "kreitos_05@outlook.com",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="max-w-[1170px] mx-auto px-6 py-8">
        <Link
          href="/"
          className="text-[#676767] text-sm font-medium tracking-[0.5em] hover:text-[#212B36] transition-colors"
        >
          ← VOLVER
        </Link>
      </header>

      {/* Main Content */}
      <section className="max-w-[1170px] mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/fermar-logo.png"
            alt="Fermar"
            width={300}
            height={70}
            className="object-contain"
          />
        </div>

        {/* Section Title */}
        <h1 className="text-[#212B36] text-[48px] font-bold leading-[56px] mb-6 text-center">
          Conoce a Nuestro Equipo
        </h1>

        {/* Section Description */}
        <p className="text-[#676767] text-[19px] leading-[36px] mb-16 text-center max-w-3xl mx-auto">
          Somos un equipo apasionado dedicado a ofrecerte los mejores productos
          y el mejor servicio.
        </p>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {staffMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow"
            >
              {/* Photo */}
              <div className="aspect-square bg-gradient-to-br from-[#ECE5D8] to-[#F9F1E3] flex items-center justify-center overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-[#212B36] text-xl font-bold mb-2">
                  {member.name}
                </h3>

                <p className="text-[#EC2A2A] text-sm font-semibold mb-3">
                  {member.position}
                </p>

                <p className="text-[#637381] text-sm leading-6 mb-4">
                  {member.description}
                </p>

                <a
                  href={`mailto:${member.email}`}
                  className="text-[#676767] text-sm hover:text-[#212B36] transition-colors"
                >
                  {member.email}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-white rounded-2xl p-12 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <h2 className="text-[#212B36] text-3xl font-bold mb-8 text-center">
            Contáctanos si tienes algun problema:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Phone */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#EC2A2A] rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-[#212B36] font-semibold mb-2">Teléfono</h3>
              <a
                href="tel:+525620562236"
                className="text-[#637381] hover:text-[#EC2A2A] transition-colors"
              >
                +52 5620562236
              </a>
            </div>

            {/* Email */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#EC2A2A] rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-[#212B36] font-semibold mb-2">Email</h3>
              <a
                href="mailto:ventasfernar4020@gmail.com"
                className="text-[#637381] hover:text-[#EC2A2A] transition-colors"
              >
                ventasfernar4020@gmail.com
              </a>
            </div>

            {/* Facebook */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#EC2A2A] rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <h3 className="text-[#212B36] font-semibold mb-2">Facebook</h3>
              <a
                href="https://www.facebook.com/juguetesfermar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#637381] hover:text-[#EC2A2A] transition-colors"
              >
                @ComercializadoraFermar4020
              </a>
            </div>

            {/* Address */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#EC2A2A] rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-[#212B36] font-semibold mb-2">Dirección</h3>
              <p className="text-[#637381]">
                Rio de la Plata Mza.16 Lte. 19. Col Escalerillas. Mpo.
                Ixtapaluca. Estado de México. C.P.56567
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-20 bg-gradient-to-br from-[#F9F1E3] to-[#ECE5D8] rounded-2xl p-12">
          <h2 className="text-[#212B36] text-3xl font-bold mb-6 text-center">
            Nuestra Historia
          </h2>
          <p className="text-[#637381] text-lg leading-8 max-w-4xl mx-auto text-center">
            Fermar nació de la pasión por los detalles y el deseo de crear
            experiencias memorables. Cada producto que ofrecemos ha sido
            cuidadosamente seleccionado para asegurar que encuentres el regalo
            perfecto para esa persona especial. Nuestro equipo trabaja
            incansablemente para brindarte una experiencia de compra excepcional
            y productos de la más alta calidad.
          </p>
        </div>
      </section>
    </div>
  );
}
