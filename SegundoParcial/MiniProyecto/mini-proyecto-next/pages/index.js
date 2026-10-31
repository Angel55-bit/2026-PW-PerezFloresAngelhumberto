export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/talleres',
      permanent: false,
    },
  };
}

export default function Inicio() {
  return null;
}
