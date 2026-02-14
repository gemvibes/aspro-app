// ===== INIT SUPABASE =====
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ===== LOAD DATA =====
async function loadItems(){
    const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("id", { ascending: true });

    if(error){
        alert("Gagal load data: " + error.message);
        return;
    }

    const tbody = document.getElementById("tabelBody");
    tbody.innerHTML = "";

    data.forEach((item, index) => {
        tbody.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td>${item.nama}</td>
            <td>${item.jumlah}</td>
            <td>${item.satuan}</td>
            <td>${item.jenis}</td>
            <td>${item.tanggal}</td>
        </tr>
        `;
    });
}

// ===== SIMPAN DATA (ANTI RELOAD 100%) =====
async function simpanData(){
    const nama = document.getElementById("namaBarang").value.trim();
    const jumlah = document.getElementById("jumlah").value;
    const satuan = document.getElementById("satuan").value.trim();
    const jenis = document.getElementById("jenis").value;
    const tanggal = document.getElementById("tanggal").value;

    if(!nama || !jumlah || !satuan || !jenis || !tanggal){
        alert("Semua field wajib diisi");
        return;
    }

    const payload = {
        nama: nama,
        jumlah: parseInt(jumlah),
        satuan: satuan,
        jenis: jenis,
        tanggal: tanggal
    };

    const { error } = await supabase.from("items").insert([payload]);

    if(error){
        alert("Gagal simpan: " + error.message);
    } else {
        alert("Data berhasil disimpan");
        loadItems();

        // reset input
        document.getElementById("namaBarang").value = "";
        document.getElementById("jumlah").value = "";
        document.getElementById("satuan").value = "";
        document.getElementById("jenis").value = "";
        document.getElementById("tanggal").value = "";
    }
}
