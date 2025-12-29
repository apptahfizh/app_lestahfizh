/* ===============================
   FIXED LAYOUT SCROLL SYSTEM
=============================== */

/* Matikan scroll global */
html,
body {
  height: 100%;
  overflow: hidden;
}

/* Wrapper utama */
#content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Topbar tetap */
.topbar {
  position: sticky;
  top: 0;
  z-index: 1030;
}

/* AREA SCROLL UTAMA */
#content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Footer tetap di bawah */
footer.sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 1020;
}
