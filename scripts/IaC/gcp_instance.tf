provider "google" {
  credentials = file("gcp_accesskey.json")
  project     =  local.gcp_accesskey.project_id
  region      = "us-central1"
}

locals {
  gcp_accesskey = jsondecode(file("gcp_accesskey.json"))
}



resource "google_compute_instance" "aleo-node" {
  name         = "aleo-node"
  machine_type = "custom-4-4096"

  zone         = "us-central1-a"

  metadata = {
    ssh-keys = "cloud_user_p_59cf731f:${file("./aleo_test_gcp_rsa.pub")}"
    user-data = file("${path.module}/cloud-config.yaml")
  }
  

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
      size = 50
    }
  }
  
  metadata_startup_script = file("./startup.sh")
  network_interface {
    network = "default"

    access_config {
      // Optional: Ephemeral IP
    }
  }
}

# Define the firewall rule to allow all incoming traffic
resource "google_compute_firewall" "aleonode_firewall" {
  name    = "allow-all"
  network = "default"

  allow {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]  # Allow traffic from any source (all IPs)
}


output "public_ip" {
  value = google_compute_instance.aleo-node.network_interface[0].access_config[0].nat_ip
}