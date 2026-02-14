// ===== LOGIN (TIDAK TERGANTUNG SUPABASE) =====
function login() {
    const pin = document.getElementById("pinInput").value;
    if (pin === "1234") {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("appPage").style.display = "block";
        loadData();
    } else {
        alert("PIN salah");
    }
}

function logout() {
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("appPage").style.display = "none";
    document.getElementById("pinInput").value = "";
}

// ===== SUPABASE =====
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ===== FORM SUBMIT =====
document.getElementById("stokForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const data = {
        nama: namaBarang.value,
        jumlah: Number(jumlah.value),
        satuan: satuan.value,
        jenis: jenis.value,
        tanggal: tanggal.value
    };

    const { error } = await supabase.from("items").insert([data]);
    if (error) {
        alert("Gagal simpan: " + error.message);
        return;
    }

    this.reset();
    loadData();
});

// ===== LOAD DATA =====
async function loadData() {
    const { data, error } = await supabase.from("items").select("*").order("tanggal");
    if (error) return;

    tabelBody.innerHTML = "";
    data.forEach(d => {
        tabelBody.innerHTML += `
        <tr>
            <td>${d.tanggal}</td>
            <td>${d.nama}</td>
            <td>${d.jumlah}</td>
            <td>${d.satuan}</td>
            <td>${d.jenis}</td>
        </tr>`;
    });

    totalTransaksi.innerText = data.length;
    totalBarang.innerText = new Set(data.map(d => d.nama)).size;
}
