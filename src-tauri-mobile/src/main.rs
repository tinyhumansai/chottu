// Mobile builds use the library entry point; this binary only exists so the
// crate can also be run on a desktop host for quick checks.
fn main() {
    chottu_mobile_lib::run()
}
