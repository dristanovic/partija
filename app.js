const tabla = document.querySelector("#tabla");

// keriramo komunikaciju sa bazom      URL Projekta                                Javni ključ koji je bezbedno koristiti u klijentskom kodu
const klijent = supabase.createClient("https://vcqzganpthronrmdviox.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcXpnYW5wdGhyb25ybWR2aW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NzkwMzcsImV4cCI6MjAyNTE1NTAzN30.VEXCtvc3WLeO6R909CEfE7UKkcVq1quQu9269HRJOgM");
const kod = new URLSearchParams(window.location.search).get("id");

document.querySelector("input").value = kod;
document.querySelector("input").setAttribute("size", kod.toString().length);

async function inicijalizuj() {
  if (!localStorage.getItem(kod)) localStorage.setItem(kod, (await klijent.rpc("slobodan_oblik", { id: kod })).data); // u lokalnoj memoriji cuvamo oblik ovog klijenta
  const potez = localStorage.getItem(kod);
  tabla.classList.add("igrac-" + potez);
  document.querySelector("#moj-oblik").classList.add(potez);
  postaviPoziciju((await klijent.from("iks_oks").select("pozicija").eq("id", kod).limit(1).single()).data.pozicija);

  const maliKvadrati = document.querySelectorAll(".mali.kvadrat");
  // svim malim kvadratima dodeljujemo funkciju koja ce obradjivati klik
  maliKvadrati.forEach((maliKvadrat) => {
    maliKvadrat.addEventListener("click", async function klik() {
      if (maliKvadrat.parentElement.classList.contains("potez-" + potez)) {
        maliKvadrat.classList.add(potez);
        proveriKvadrat(maliKvadrat.parentElement, potez);
        proveriKvadrat(tabla, potez);
        resetujKvadrate();

        if (!tabla.classList.contains("iks") && !tabla.classList.contains("oks") && document.querySelectorAll(".veliki.iks , .veliki.oks").length < 9) sledeciKvadrati(maliKvadrat);

        // obaveštavamo bazu podataka da je potez odigran
        await klijent.rpc("napravi_potez", {
          id: kod,
          nova_pozicija: pozicija(),
        });
        maliKvadrat.removeEventListener("click", klik);
      }
    });
  });
}
inicijalizuj();

const promene = klijent
  .channel("promena-pozicije")
  .on(
    "postgres_changes",
    {
      event: "UPDATE", // na svaki UPDATE
      schema: "public",
      table: "iks_oks", // nad tabelom iks_oks
      filter: "id=eq." + kod, // gde je id jednak kodu partije
    },
    (data) => postaviPoziciju(data.new.pozicija) // postavljamo novu poziciju
  )
  .subscribe();

function aktivirajKvadrat(kvadrat, potez) {
  kvadrat.classList.add("potez-" + potez);
}

function proveriKvadrat(kvadrat, potez) {
  if (kvadrat.querySelectorAll(":scope > .gore." + potez).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .centar." + potez).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .dole." + potez).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .levo." + potez).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .sredina." + potez).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .desno." + potez).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(`:scope > .gore.levo.${potez}, :scope > .centar.sredina.${potez}, :scope > .dole.desno.${potez}`).length === 3) kvadrat.classList.add(potez);
  else if (kvadrat.querySelectorAll(`:scope > .gore.desno.${potez}, :scope > .centar.sredina.${potez}, :scope > .dole.levo.${potez}`).length === 3) kvadrat.classList.add(potez);
}
function resetujKvadrate() {
  document.querySelectorAll(".potez-iks, .potez-oks").forEach((kvadrat) => {
    kvadrat.classList.remove("potez-iks");
    kvadrat.classList.remove("potez-oks");
  });
}
function sledeciKvadrati(maliKvadrat) {
  const velikiKvadrat = document.querySelector(`.veliki.kvadrat[data-index="${maliKvadrat.dataset.index}"]`);

  let potez;
  if (maliKvadrat.classList.contains("iks")) potez = "oks";
  else potez = "iks";
  if (velikiKvadrat.classList.contains("iks") || velikiKvadrat.classList.contains("oks") || velikiKvadrat.querySelectorAll(".iks, .oks").length === 9) {
    document.querySelectorAll(".veliki.kvadrat:not(.iks, .oks)").forEach((velikiKvadrat) => {
      if (velikiKvadrat.querySelectorAll(".iks, .oks").length < 9) aktivirajKvadrat(velikiKvadrat, potez);
    });
  } else aktivirajKvadrat(velikiKvadrat, potez);
}

function pozicija() {
  let pozicija = "";
  document.querySelectorAll(".kvadrat").forEach((kvadrat) => {
    if (kvadrat.classList.contains("potez-iks")) pozicija += "x";
    else if (kvadrat.classList.contains("potez-oks")) pozicija += "o";
    else if (kvadrat.classList.contains("iks")) pozicija += "X";
    else if (kvadrat.classList.contains("oks")) pozicija += "O";
    else pozicija += "-";

    if (kvadrat.classList.contains("veliki")) pozicija += "=";
    else if (kvadrat.classList.contains("dole") && kvadrat.classList.contains("desno")) pozicija += " ";
  });

  return pozicija.trimEnd(); // za praznu tablu vraca "-=-------- -=--------- -=--------- --=--------- -=--------- -=--------- -=--------- -=--------- -=---------"
}
function postaviPoziciju(pozicija) {
  resetujKvadrate();

  pozicija = pozicija.replaceAll(" ", "").replaceAll("=", "");

  document.querySelectorAll(".kvadrat").forEach((kvadrat, index) => {
    if (pozicija[index] === "x") kvadrat.classList.add("potez-iks");
    else if (pozicija[index] === "o") kvadrat.classList.add("potez-oks");
    else if (pozicija[index] === "X") kvadrat.classList.add("iks");
    else if (pozicija[index] === "O") kvadrat.classList.add("oks");
  });
  proveriKvadrat(tabla, "iks");
  proveriKvadrat(tabla, "oks");
}

function kreirajQR() {
  const div = document.createElement("div");
  div.setAttribute("id", "qr-kod");
  div.setAttribute("onclick", "this.remove();");
  document.querySelector("body").append(div);
  const velicina = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  new QRCode(div, {
    text: window.location.href,
    width: velicina,
    height: velicina,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L,
  });
}
