const tabla = document.querySelector("#tabla");

// keriramo komunikaciju sa bazom      URL Projekta                                Javni ključ koji je bezbedno koristiti u klijentskom kodu
const klijent = supabase.createClient("https://vcqzganpthronrmdviox.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcXpnYW5wdGhyb25ybWR2aW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NzkwMzcsImV4cCI6MjAyNTE1NTAzN30.VEXCtvc3WLeO6R909CEfE7UKkcVq1quQu9269HRJOgM");
const kod = new URLSearchParams(window.location.search).get("id");

async function inicijalizuj() {
  if (!localStorage.getItem(kod)) localStorage.setItem(kod, (await klijent.rpc("slobodan_oblik", { id: kod })).data); // u lokalnoj memoriji cuvamo oblik ovog klijenta
  const potez = localStorage.getItem(kod);
  tabla.classList.add("igrac-" + potez);
  postaviPoziciju((await klijent.from("iks_oks").select("pozicija").eq("id", kod).limit(1).single()).data.pozicija);

  const maliKvadrati = document.querySelectorAll(".mali.kvadrat");
  // svim malim kvadratima dodeljujemo funkciju koja će obrađivati klik
  maliKvadrati.forEach((maliKvadrat) => {
    maliKvadrat.addEventListener("click", async function klik() {
      if (maliKvadrat.parentElement.classList.contains("potez-" + potez)) {
        maliKvadrat.classList.add(potez);
        proveriKvadrat(maliKvadrat, potez);
        proveriKvadrat(maliKvadrat.parentElement, potez);
        resetujKvadrate();

        // proveravamo da li je partija gotova, ako nije aktiviramo sledece velike kvadrate
        if (!tabla.classList.contains("iks") && !tabla.classList.contains("oks") && document.querySelectorAll(".veliki.kvadrat.iks , .veliki.kvadrat.oks").length !== 9) sledeciKvadrati(maliKvadrat);
        maliKvadrat.removeEventListener("click", klik); // kada kliknemo na kvadrat ne možemo ga više koristiti
        
        const { data, error } = await klijent.rpc("napravi_potez", { id: kod, nova_pozicija: pozicija() });
      }
    });
  });
}
inicijalizuj();

const changes = klijent
  .channel("promena-pozicije")
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "iks_oks",
      filter: "id=eq." + kod,
    },
    (data) => postaviPoziciju(data.new.pozicija)
  )
  .subscribe();

function aktivirajKvadrat(kvadrat, potez) {
  kvadrat.classList.add("potez-" + potez);
}
function proveriKvadrat(kvadrat, potez) {
  if (kvadrat.querySelectorAll(":scope > .gore").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .centar").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .dole").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .levo").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .sredina").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .desno").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .gore.levo, :scope > .centar.sredina, :scope > .dole.desno").length === 3) kvadrat.parentElement.classList.add(potez);
  else if (kvadrat.querySelectorAll(":scope > .gore.desno, :scope > .centar.sredina, :scope > .dole.levo").length === 3) kvadrat.parentElement.classList.add(potez);
}
function resetujKvadrate() {
  document.querySelectorAll(".potez-iks, .potez-oks").forEach((kvadrat) => {
    kvadrat.classList.remove("potez-iks");
    kvadrat.classList.remove("potez-oks");
  });
}
function sledeciKvadrati(maliKvadrat) {
  let velikiKvadrat;
  if (maliKvadrat.classList.contains("gore")) {
    if (maliKvadrat.classList.contains("levo")) velikiKvadrat = document.querySelector(".veliki.kvadrat.gore.levo");
    else if (maliKvadrat.classList.contains("desno")) velikiKvadrat = document.querySelector(".veliki.kvadrat.gore.desno");
    else velikiKvadrat = document.querySelector(".veliki.kvadrat.gore.sredina");
  } else if (maliKvadrat.classList.contains("centar")) {
    if (maliKvadrat.classList.contains("levo")) velikiKvadrat = document.querySelector(".veliki.kvadrat.centar.levo");
    else if (maliKvadrat.classList.contains("desno")) velikiKvadrat = document.querySelector(".veliki.kvadrat.centar.desno");
    else velikiKvadrat = document.querySelector(".veliki.kvadrat.centar.sredina");
  } else {
    if (maliKvadrat.classList.contains("levo")) velikiKvadrat = document.querySelector(".veliki.kvadrat.dole.levo");
    else if (maliKvadrat.classList.contains("desno")) velikiKvadrat = document.querySelector(".veliki.kvadrat.dole.desno");
    else velikiKvadrat = document.querySelector(".veliki.kvadrat.dole.sredina");
  }

  let potez;
  if (maliKvadrat.classList.contains("iks")) potez = "oks";
  else potez = "iks";
  if (velikiKvadrat.classList.contains("iks") || velikiKvadrat.classList.contains("oks") || velikiKvadrat.querySelectorAll(".iks, .oks").length === 9) {
    document.querySelectorAll(".veliki.kvadrat:not(.iks, .oks)").forEach((velikiKvadrat) => aktivirajKvadrat(velikiKvadrat, potez));
  } else aktivirajKvadrat(velikiKvadrat, potez);
}
/*


*/
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
  document.querySelectorAll(".kvadrat").forEach((kvadrat, index) => postaviKvadrat(kvadrat, pozicija[index]));

  function postaviKvadrat(kvadrat, opcija) {
    if (opcija === "x") kvadrat.classList.add("potez-iks");
    else if (opcija === "o") kvadrat.classList.add("potez-oks");
    else if (opcija === "X") kvadrat.classList.add("iks");
    else if (opcija === "O") kvadrat.classList.add("oks");
  }

  /*const velikiKvadrati = document.querySelectorAll(".veliki.kvadrat");
  pozicija.split(" ").forEach((pozicijaVelikogKvadrata, index) => {
    postaviKvadrat(velikiKvadrati[index], pozicijaVelikogKvadrata[0]);

    const pozicijaMalihKvadrata = pozicijaVelikogKvadrata.split("=")[1];
    for (let i = 0; i < pozicijaMalihKvadrata.length; i++) {
      postaviKvadrat(velikiKvadrati[index].children[i], pozicijaMalihKvadrata[i]);
    }
  });*/
}
