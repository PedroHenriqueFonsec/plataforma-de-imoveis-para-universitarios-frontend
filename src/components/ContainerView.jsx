const ContainerView = ({ children }) => {
  return (
    <div
      id="container-view"
      style={{
        paddingTop: "7vh",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
      }}
    >
      {children}
    </div>
  );
};

export default ContainerView;
