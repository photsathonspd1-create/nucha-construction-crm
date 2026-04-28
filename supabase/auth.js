// ============================================
// NUCHA CRM — Authentication Module
// Uses Supabase Auth for admin dashboard
// ============================================

const Auth = {
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'admin-login.html';
    },

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async getProfile() {
        const user = await this.getUser();
        if (!user) return null;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        return data;
    },

    async requireAuth() {
        const session = await this.getSession();
        if (!session) {
            window.location.href = 'admin-login.html';
            return null;
        }
        return session;
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};

window.Auth = Auth;
