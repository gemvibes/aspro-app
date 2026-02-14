// ===== SUPABASE INIT =====
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== LOAD DATA =====
async function loadItems(){
    const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("id", { ascending: true });

    if(error){
        alert("Load gagal: " + error.message);
        return;
    }

    const tbody = document.getElementById("tabelBody");
    tbody.innerHTML = "";

    data.forEach((item, i)=>{
        tbody.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${item.nama}</td>
            <td>${item.jumlah}</td>
            <td>${item.satuan}</td>
            <td>${item.jenis}</td>
            <td>${item.tanggal}</td>
        </tr>`;
    });
}

// ===== SIMPAN DATA =====
async function simpanData(){
    const payload = {
        nama: namaBarang.value.trim(),
        jumlah: parseInt(jumlah.value),
        satuan: satuan.value.trim(),
        jenis: jenis.value,
        tanggal: tanggal.value
    };

    if(Object.values(payload).some(v => !v)){
        alert("Lengkapi semua data");
        return;
    }

    const { error } = await supabase.from("items").insert([payload]);

    if(error){
        alert("Simpan gagal: " + error.message);
    } else {
        alert("Berhasil disimpan");
        loadItems();
        stokForm.reset();
    }
}
