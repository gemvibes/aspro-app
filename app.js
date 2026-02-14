// ===== LOGIN & LOGOUT =====
const correctPin = "1234";

function login() {
    const pin = document.getElementById("pinInput").value;
    if(pin === correctPin){
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("appPage").style.display = "block";
        alert("Login berhasil!");
        loadItems();
    } else {
        alert("PIN salah!");
    }
}

function logout() {
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("appPage").style.display = "none";
}

// ===== SUPABASE CONFIG =====
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ===== TAMBAH ITEM =====
async function addItem(name, quantity, unit, type, date) {
    const { data, error } = await supabase
      .from('items')
      .insert([{ name, quantity, unit, type, date }]);
    
    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Berhasil menambahkan item!");
        loadItems();
    }
}

// ===== LOAD ITEMS =====
async function loadItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
        console.log("Error:", error.message);
        return;
    }
    
    const tableBody = document.getElementById('tabelBody');
    tableBody.innerHTML = "";

    const barangList = document.getElementById('barangList');
    barangList.innerHTML = "";

    let totalBarang = 0;

    data.forEach((item, index) => {
        totalBarang++;
        // Tabel transaksi
        const row = `<tr>
            <td>${index+1}</td>
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>${item.type}</td>
            <td>
                <button onclick="editItem(${item.id})">Edit</button>
                <button onclick="deleteItem(${item.id})">Hapus</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;

        // Datalist nama barang
        const option = `<option value="${item.name}">`;
        barangList.innerHTML += option;
    });

    document.getElementById('totalBarang').innerText = totalBarang;
}

// ===== FORM SUBMIT =====
document.getElementById('stokForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('namaBarang').value;
    const quantity = parseInt(document.getElementById('jumlah').value);
    const unit = document.getElementById('satuan').value;
    const type = document.getElementById('jenis').value;
    const date = document.getElementById('tanggal').value;

    await addItem(name, quantity, unit, type, date);

    // Reset form
    document.getElementById('stokForm').reset();
});

// ===== EDIT & DELETE =====
async function editItem(id){
    const { data } = await supabase.from('items').select('*').eq('id', id);
    if(data && data.length>0){
        const item = data[0];
        document.getElementById('editIndex').value = id;
        document.getElementById('namaBarang').value = item.name;
        document.getElementById('jumlah').value = item.quantity;
        document.getElementById('satuan').value = item.unit;
        document.getElementById('jenis').value = item.type;
        document.getElementById('tanggal').value = item.date;
    }
}

async function deleteItem(id){
    if(confirm("Yakin hapus item ini?")){
        await supabase.from('items').delete().eq('id', id);
        loadItems();
    }
}

// ===== FILTER BULAN =====
document.getElementById('filterBulan').addEventListener('change', async ()=>{
    const month = document.getElementById('filterBulan').value;
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .like('date', `${month}%`)
      .order('id', { ascending: true });

    const tableBody = document.getElementById('tabelBody');
    tableBody.innerHTML = "";

    data.forEach((item,index)=>{
        const row = `<tr>
            <td>${index+1}</td>
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>${item.type}</td>
            <td>
                <button onclick="editItem(${item.id})">Edit</button>
                <button onclick="deleteItem(${item.id})">Hapus</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
});

// ===== EXPORT CSV =====
document.getElementById('exportCSV').addEventListener('click', async ()=>{
    const { data } = await supabase.from('items').select('*');
    let csv = "No,Tanggal,Nama,Jumlah,Satuan,Jenis\n";
    data.forEach((item,index)=>{
        csv += `${index+1},${item.date},${item.name},${item.quantity},${item.unit},${item.type}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "aspro_transaksi.csv";
    link.click();
});
