# ☕ Tito Café - Backend

Este es el repositorio del backend (servidor) para la aplicación web **Tito Café**. Esta API REST se encarga de toda la lógica de negocio, la gestión de la base de datos, la autenticación de usuarios y el procesamiento de pagos.

**API en vivo:** [https://tito-cafe-backend.onrender.com](https://tito-cafe-backend.onrender.com)

**Repositorio del Frontend:** [https://github.com/falc5561-ux/tito-cafe-frontend](https://github.com/falc5561-ux/tito-cafe-frontend)

---

## ✨ Características Principales

* **API RESTful:** Sigue los principios de diseño REST para la gestión de recursos.
* **Autenticación y Autorización:** Implementa JSON Web Tokens (JWT) para proteger rutas y gestionar los roles de usuario (Cliente, Empleado, Jefe).
* **Integración con Stripe:** Procesa pagos de forma segura, creando "Payment Intents" y manejando webhooks.
* **Base de Datos PostgreSQL:** Conectado a una base de datos PostgreSQL para persistir toda la información de usuarios, productos, y pedidos.
* **Manejo de CORS:** Configurado para aceptar peticiones de forma segura desde el dominio del frontend.

## 🛠️ Tecnologías Utilizadas

* **Entorno:** Node.js
* **Framework:** Express.js
* **Base de Datos:** PostgreSQL (con la librería `pg`)
* **Autenticación:** JSON Web Token (`jsonwebtoken`), `bcryptjs`
* **Pagos:** Stripe (`stripe`)
* **Middleware:** `cors`

## 🚀 Cómo ejecutar este proyecto localmente

Sigue estos pasos para levantar el servidor en tu máquina local.

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/falc5561-ux/tito-cafe-backend.git](https://github.com/falc5561-ux/tito-cafe-backend.git)
    ```

2.  **Entra a la carpeta del proyecto:**
    ```bash
    cd tito-cafe-backend
    ```

3.  **Instala las dependencias:**
    (Este comando lee el `package.json` e instala todo lo necesario, como Express, pg, cors, etc.)
    ```bash
    npm install
    ```

4.  **Configura las variables de entorno:**
    Crea un archivo llamado `.env` en la raíz del proyecto. Este archivo es **crucial** y debe contener las claves secretas. (El archivo `.gitignore` previene que se suba a GitHub).

    Tu archivo `.env` debe verse así:
    ```
    # Configuración de la Base de Datos (ejemplo de Render)
    DATABASE_URL="postgres://usuario:contraseña@host:port/basededatos"

    # Clave secreta para firmar los JWT
    JWT_SECRET="tu_clave_secreta_muy_segura_aqui"

    # Claves de Stripe
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."

    # URL del frontend (para CORS)
    FRONTEND_URL="http://localhost:5173"
    ```

5.  **Ejecuta el servidor:**
    ```bash
    npm start
    ```
    (O `npm run dev` si tienes `nodemon` configurado).

El servidor estará corriendo en el puerto que hayas definido (ej. `http://localhost:3000`).

## 📦 Despliegue

Este proyecto está desplegado en **Render**. Cada `git push` a la rama `main` dispara un nuevo despliegue automático. Las variables de entorno (`.env`) se configuran directamente en el panel de "Environment" de Render.