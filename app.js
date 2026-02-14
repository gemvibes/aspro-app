const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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

    data.forEach(item=>{
        tbody.innerHTML += `
        <tr>
            <td>${item.nama}</td>
            <td>${item.jumlah}</td>
            <td>${item.satuan}</td>
            <td>${item.jenis}</td>
            <td>${item.tanggal}</td>
        </tr>`;
    });
}

document.getElementById("stokForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const payload = {
        nama: document.getElementById("namaBarang").value,
        jumlah: parseInt(document.getElementById("jumlah").value),
        satuan: document.getElementById("satuan").value,
        jenis: document.getElementById("jenis").value,
        tanggal: document.getElementById("tanggal").value
    };

    const { error } = await supabase.from("items").insert([payload]);

    if(error){
        alert("Gagal simpan: " + error.message);
    } else {
        alert("Berhasil disimpan");
        loadItems();
        document.getElementById("stokForm").reset();
    }
});
