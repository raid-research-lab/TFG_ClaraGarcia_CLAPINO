import { GoogleLogin } from "@react-oauth/google";

function Inicio({ onEntrar }) {

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(
        "http://localhost:5000/auth/google",
        {
          method: "POST",

          credentials: "include",
          
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            credential: credentialResponse.credential
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      console.log(
        "Usuario autenticado:",
        data.usuario
      );

      onEntrar(data.usuario);

    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error
      );
    }
  };


  return (
    <div className="inicio">
      <div className="inicio-contenido">

        <h1>CLAPINO</h1>

        <p className="inicio-subtitulo">
          TRADUCTOR
        </p>

        <p className="inicio-lenguajes">
          SQL · CRT · AR
        </p>

        <div className="google-login">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log(
                "Error al iniciar sesión con Google"
              );
            }}
          />
        </div>

      </div>
    </div>
  );
}

export default Inicio;